import type { TranslationStrings } from '../types';

// English fallback until 'ja' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'この画面のヘルプ',
  'help.center.title': 'ヘルプ',
  'help.center.onThisScreen': 'この画面について',
  'help.center.screens': '画面',
  'help.center.thisScreen': 'この画面',
  'help.center.subScreens': 'サブ画面: {count}',
  'help.center.subScreensLabel': 'サブ画面',
  'help.center.guidesCount': 'ガイド {count} 件',
  'help.center.goToScreen': '{screen} を開く',
  'help.center.overview': '概要',
  'help.center.howTo': '操作ガイド',
  'help.center.searchPlaceholder': 'ガイドとドキュメントを検索…',
  'help.center.searchEmpty': '「{query}」に一致するものはありません。',
  'help.center.searchGuides': 'ガイド',
  'help.center.searchDocs': 'ドキュメント',
  'help.center.searchError': '現在、検索を利用できません。',
  'help.center.back': '戻る',
  'help.center.close': 'ヘルプを閉じる',
  'help.center.steps': '{count}ステップ',
  'help.center.step': 'ステップ{n}',
  'help.center.stepsLabel': 'ステップ',
  'help.center.stepOf': 'ステップ {n} / {total}',
  'help.center.screenshot': 'スクリーンショット',
  'help.center.result': '結果',
  'help.center.tips': '知っておくと便利',
  'help.center.related': '関連',
  'help.center.openDocs': 'ヘルプ＆ドキュメントで開く',
  'help.center.docsSection': 'ドキュメント',
  'help.center.noContext': 'この画面のガイドはまだありません。',
  'help.center.noContextHint': 'ドキュメントを検索するか、探していた内容を教えてください。',
  'help.center.feedback': '足りない内容がありますか？',
  'help.center.feedbackLink': 'GitHubで教えてください',
  'help.center.discord': 'Discordで質問する',
  'help.center.quick': 'かんたん',
  'help.center.guide': 'ガイド',
  'help.center.tour': '操作デモ',
  'help.center.imageAlt': '「{title}」のステップ{n}',

  // ctx
  'help.ctx.dashboard.title': 'ダッシュボード',
  'help.ctx.dashboard.summary':
    'ダッシュボードはすべての旅行への入口です。上部の搭乗券は進行中または次の旅行を大きく表示し、その下の行はこれまでの旅の記録を集計し、カードには計画中、アーカイブ済み、完了済みの旅行がすべて並びます。',
  'help.ctx.dashboard.bullet.1':
    '搭乗券：進行中または次の旅行を、日程・同行者・場所・カウントダウンとともに表示します。クリックすると旅行が開きます。',
  'help.ctx.dashboard.bullet.2': '旅の統計：訪れた国、旅行数、旅の日数、飛行距離を、すべての旅行にわたって集計します。',
  'help.ctx.dashboard.bullet.3':
    '旅行カード：「予定」「アーカイブ済み」「完了」で絞り込み、グリッドまたはリストで表示します。カードにマウスを乗せると編集・複製・アーカイブ・削除ができます。',
  'help.ctx.dashboard.bullet.4':
    '右側のウィジェット：通貨換算、世界時計、今後の予約、コレクション。それぞれ非表示にできます。',
  'help.ctx.dashboard.bullet.5': '「新しい旅行」カードと右下のボタンは、どちらも新しい旅行を作成します。',

  // create-trip
  'help.guide.create-trip.title': '旅行を作成する',
  'help.guide.create-trip.goal': '名前、日程、カバー写真を付けて新しい旅行を始めます。',
  'help.guide.create-trip.step.1':
    '「新しい旅行」をクリックします。旅行一覧の末尾にあるカードと右下のボタンは同じ働きをします。',
  'help.guide.create-trip.step.2': '旅行に名前を付けます。必須なのはこの項目だけで、ほかはあとから追加できます。',
  'help.guide.create-trip.step.3':
    '開始日と終了日を選びます。TREKは日付ごとに1日分を作成するので、旅程をすぐに埋めていけます。',
  'help.guide.create-trip.step.4':
    '任意：カバー写真を追加します。自分の写真をアップロードするか、ドラッグするか、Unsplashで目的地を検索します。',
  'help.guide.create-trip.step.5': '「新しい旅行を作成」をクリックします。',
  'help.guide.create-trip.result': '旅行がダッシュボードに表示されます。次の旅行であれば、上部の搭乗券に表示されます。',
  'help.guide.create-trip.tip.1':
    '日程はあとから変更できます。すでに予約がある場合、TREKは予約も日程と一緒に動かすかどうかを確認します。',
  'help.guide.create-trip.tip.2':
    'ここで選ぶ旅行の通貨は、すべての費用の換算先になります。目的地の通貨を選んでください。',

  // edit-trip
  'help.guide.edit-trip.title': '旅行を編集する',
  'help.guide.edit-trip.goal': '旅行の名前を変えたり、日程を変更したり、設定を調整したりします。',
  'help.guide.edit-trip.step.1': '旅行カード（または搭乗券）にマウスを乗せ、鉛筆アイコンをクリックします。',
  'help.guide.edit-trip.step.2': '必要な項目を変更します：名前、説明、日程、カバー、通貨、リマインダー、メンバー。',
  'help.guide.edit-trip.step.3': '「更新」をクリックします。',
  'help.guide.edit-trip.result': 'カードはすぐに更新され、旅行のすべてのメンバーに反映されます。',
  'help.guide.edit-trip.tip.1':
    'すでに予約のある旅行の日程を動かすと、予約も一緒に動かすかどうかを尋ねる2つ目のステップが表示されます。',

  // cover-image
  'help.guide.cover-image.title': 'カバー写真を設定する',
  'help.guide.cover-image.goal': 'カードと搭乗券に表示される画像を旅行に設定します。',
  'help.guide.cover-image.step.1': 'カードの鉛筆アイコンから旅行の編集フォームを開きます。',
  'help.guide.cover-image.step.2':
    '「カバー画像」で写真をドロップするか、クリックしてアップロードするか、Unsplash検索に目的地を入力します。',
  'help.guide.cover-image.step.3': '写真を選び、「更新」をクリックします。',
  'help.guide.cover-image.result': '写真は旅行とともに保存され、旅行が表示されるすべての場所に表示されます。',
  'help.guide.cover-image.tip.1':
    'Unsplash検索の写真には自動的にクレジットが付きます。自分でアップロードした写真はあなたのサーバーに残ります。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '旅行を複製する',
  'help.guide.duplicate-trip.goal': '既存の旅行をテンプレートとして新しい旅行に使います。',
  'help.guide.duplicate-trip.step.1': 'カードにマウスを乗せ、複製アイコンをクリックします。',
  'help.guide.duplicate-trip.step.2': 'コピーされる内容とされない内容を確認し、確定します。',
  'help.guide.duplicate-trip.result': '元の旅行の隣にコピーが表示されます。名前と日程を変えてすぐ使えます。',
  'help.guide.duplicate-trip.tip.1':
    '日程、場所、予約、予算項目、持ち物リスト、日ごとのメモはコピーされます。メンバー、チャット、投票、ファイル、共有リンクはコピーされません。',

  // archive-trip
  'help.guide.archive-trip.title': '旅行をアーカイブ・復元する',
  'help.guide.archive-trip.goal': '旅行を削除せずに片付け、あとで戻します。',
  'help.guide.archive-trip.step.1': 'カードにマウスを乗せ、「アーカイブ」をクリックします。',
  'help.guide.archive-trip.step.2': 'カード上部のフィルターを「アーカイブ済み」に切り替えると再び表示されます。',
  'help.guide.archive-trip.step.3': 'カードの「復元」をクリックすると「予定」に戻ります。',
  'help.guide.archive-trip.result':
    'アーカイブした旅行のデータはすべて残ります。ダッシュボードと全旅行のカレンダーフィードに表示されなくなるだけです。',

  // delete-trip
  'help.guide.delete-trip.title': '旅行を削除する',
  'help.guide.delete-trip.goal': '旅行を完全に削除します。',
  'help.guide.delete-trip.step.1': 'カードにマウスを乗せ、ゴミ箱アイコンをクリックします。',
  'help.guide.delete-trip.step.2': '確定します。ダイアログに旅行名が表示されるので、間違いがないか確認できます。',
  'help.guide.delete-trip.result':
    '旅行とその日程、場所、予約、ファイルが削除されます。元に戻せないので、迷う場合はアーカイブしてください。',

  // filter-and-view
  'help.guide.filter-and-view.title': '完了した旅行を探す・グリッドとリストを切り替える',
  'help.guide.filter-and-view.goal': '完了またはアーカイブした旅行を表示し、好みのレイアウトを選びます。',
  'help.guide.filter-and-view.step.1':
    'カード上部の「予定」「アーカイブ済み」「完了」を使います。終了日を過ぎた旅行はすべて「完了」に入ります。',
  'help.guide.filter-and-view.step.2':
    'リストアイコンをクリックするとコンパクトなリスト表示になり、もう一度クリックするとグリッドに戻ります。',
  'help.guide.filter-and-view.result': 'ダッシュボードはこの端末でのレイアウトを記憶します。',

  // calendar-feed
  'help.guide.calendar-feed.title': 'すべての旅行をカレンダーで購読する',
  'help.guide.calendar-feed.goal': '進行中のすべての旅行の日程と予約を、カレンダーアプリで常に同期して表示します。',
  'help.guide.calendar-feed.step.1': '表示切り替えの隣にあるカレンダーアイコンをクリックします。',
  'help.guide.calendar-feed.step.2':
    '「Enable calendar subscription」をクリックします。TREKが非公開のフィードリンクを生成します。',
  'help.guide.calendar-feed.step.3':
    'ボタン（Google、Apple、Outlook）でフィードを追加するか、URL購読に対応したカレンダーアプリにリンクをコピーします。',
  'help.guide.calendar-feed.result':
    '進行中のすべての旅行がカレンダーに表示され、自動で更新されます。アーカイブ済みの旅行と、終了から90日以上経った旅行は含まれません。',
  'help.guide.calendar-feed.tip.1':
    'リンクは秘密の情報です。リンクを知っている人は誰でもフィードを読めます。漏れた場合は同じダイアログから無効にしてください。',

  // widgets
  'help.guide.widgets.title': 'ダッシュボードのウィジェットを選ぶ',
  'help.guide.widgets.goal': '統計の行と右側のウィジェットの表示・非表示を切り替えます。',
  'help.guide.widgets.step.1': '右上のアバターメニューを開き、「設定」を選びます。',
  'help.guide.widgets.step.2': '「Appearance」タブに切り替えます。',
  'help.guide.widgets.step.3':
    '「Dashboard widgets」で各ウィジェットをオン・オフします。デスクトップとモバイルは別々に設定します。',
  'help.guide.widgets.step.4': 'ダッシュボードに戻ります。変更はすぐに反映されます。',
  'help.guide.widgets.result':
    '非表示にしたウィジェットの分だけ旅行のスペースが広がります。右の列をすべてオフにするとレイアウトが中央寄せになります。',
  'help.guide.widgets.link': '外観設定を開く',

  // currency-widget
  'help.guide.currency-widget.title': '通貨を換算する',
  'help.guide.currency-widget.goal': '最新のレートで2つの通貨の間で金額を換算します。',
  'help.guide.currency-widget.step.1': '金額を入力し、2つの通貨を選びます。',
  'help.guide.currency-widget.step.2': '間の矢印で通貨ペアを入れ替え、円形の矢印でレートを更新します。',
  'help.guide.currency-widget.result': '通貨ペアはアカウントに保存されるので、どの端末でも同じです。',
  'help.guide.currency-widget.tip.1': 'レートは欧州中央銀行のもので、1日1回更新されます。',

  // timezones-widget
  'help.guide.timezones-widget.title': '世界時計を追加する',
  'help.guide.timezones-widget.goal': '目的地の現地時刻を手元で確認します。',
  'help.guide.timezones-widget.step.1': '「タイムゾーン」ウィジェットの + をクリックし、都市を検索します。',
  'help.guide.timezones-widget.step.2': '時計の隣の × で削除できます。',
  'help.guide.timezones-widget.result': '時計はアカウントに保存されます。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacayはあなた専用の休暇プランナーです。年間の休暇日数、記録済みの日、残りの日数を管理します。グリッドは1年全体をひと目で表示し、サイドバーには年の切り替え、一緒に計画する人、共有されたカレンダー、凡例、休暇の付与日数が並びます。',
  'help.ctx.vacay.bullet.1':
    '年間グリッド：12枚の月カード、1日1セル。クリックで記録または取り消しができます。小さな青い点は、すでに旅行が入っている日を示します。',
  'help.ctx.vacay.bullet.2':
    '下部のツールバー：「休暇」モードまたは「会社休日」モードに加え、クリックで何を記録するかを変える「半休」と「代休・フレックス」の切り替え。',
  'help.ctx.vacay.bullet.3': '「付与日数」：その年の日数、使用済みと残り、前期からの繰り越しを含みます。',
  'help.ctx.vacay.bullet.4':
    '「人物」はあなたのプランと統合された人で、それぞれ色があります。「共有カレンダー」は他の人の休みを読み取り専用のリングで示します。',
  'help.ctx.vacay.bullet.5':
    '「設定」では週末、週の始まり、繰り越し、休暇年度、会社休日、祝日や学校休暇のカレンダーを扱います。',
  // log-day
  'help.guide.log-day.title': '休暇日を記録する',
  'help.guide.log-day.goal': '年間グリッドで休みの日を記録し、残日数が変わるのを確認します。',
  'help.guide.log-day.step.1':
    '下部のツールバーを確認します。あなたの色の左のボタンは、クリックであなたの休暇日を記録することを示します。',
  'help.guide.log-day.step.2':
    'いずれかの月カードの日をクリックします。あなたの色で塗られ、「使用済み」が1日増えます。',
  'help.guide.log-day.step.3': '同じ日をもう一度クリックすると取り消せます。',
  'help.guide.log-day.result':
    '日が記録され、「日」「使用済み」「残り」がすぐに更新され、プランを統合している人全員にリアルタイムで反映されます。',
  'help.guide.log-day.tip.1': '「設定」で「週末を除外」がオンの間は、週末は記録できません。',
  'help.guide.log-day.tip.2':
    'セルの青い点は、あなたの旅行がその日に重なっていることを示します。休暇と旅行が重なる場所がわかります。',
  // half-day
  'help.guide.half-day.title': '半日を記録する',
  'help.guide.half-day.goal': '1日分の付与を使わずに午後だけ休みます。',
  'help.guide.half-day.step.1': 'ツールバーで「半休」をオンにします。オレンジの点は、グリッドで半日に付くマークです。',
  'help.guide.half-day.step.2': '日をクリックします。0.5として記録され、角にオレンジの点が付きます。',
  'help.guide.half-day.step.3':
    '終わったら「半休」をオフに戻します。別の設定で半日をクリックすると、その場で変換されます。',
  'help.guide.half-day.result':
    '「使用済み」が0.5増えます。「半休」と「代休・フレックス」は独立しているので、半日の代休も可能です。',
  'help.guide.half-day.tip.1': 'ツールバーには次のクリックで付くマークが常に表示されるので、記録前に確認できます。',
  // comp-day
  'help.guide.comp-day.title': '代休やフレックスを記録する',
  'help.guide.comp-day.goal': '休暇日数を消費しない代休を取ります。',
  'help.guide.comp-day.step.1':
    'ツールバーで「代休・フレックス」をオンにします。斜線のディスクは、グリッドでの代休日の見た目です。',
  'help.guide.comp-day.step.2': '日をクリックします。塗りつぶしではなく、あなたの色の斜線で表示されます。',
  'help.guide.comp-day.result': '代休日は付与日数のタイルの横に別途集計され、「残り」を減らすことはありません。',
  'help.guide.comp-day.tip.1': '残業の振替、フレックス、代休：休みだけれど休暇ではないものはすべてここに入ります。',
  // entitlement
  'help.guide.entitlement.title': '付与日数を設定する',
  'help.guide.entitlement.goal': '年間の休暇日数をVacayに登録します。',
  'help.guide.entitlement.step.1': 'サイドバーの「付与日数」にある「日」タイルをクリックします。',
  'help.guide.entitlement.step.2': '日数を入力してEnterを押します。',
  'help.guide.entitlement.result': '「残り」は付与日数、繰り越し、使用済みの日数から再計算されます。',
  'help.guide.entitlement.tip.1': '付与日数は年ごとに独立しているので、ここでの変更は選択中の年にだけ反映されます。',
  // years
  'help.guide.years.title': '年を追加・切り替える',
  'help.guide.years.goal': '来年を先に計画したり、昨年を振り返ったりします。',
  'help.guide.years.step.1': '年の右の＋で翌年を、左の＋で前年を追加します。',
  'help.guide.years.step.2': '矢印または下の年チップで年を切り替えます。',
  'help.guide.years.step.3':
    '年を削除するには、チップにマウスを乗せて小さなマイナスをクリックします。その年の記録も消えるので、慎重に確認してください。',
  'help.guide.years.result': '各年は独自の付与日数と記録を保持し、繰り越しがそれらをつなぎます。',
  // company-holidays
  'help.guide.company-holidays.title': '会社休日を設定する',
  'help.guide.company-holidays.goal': '会社全体が休みの日を、誰の付与日数も使わずにブロックします。',
  'help.guide.company-holidays.step.1':
    '「設定」を開き、「会社休日」がオンになっていることを確認します。既定でオンで、オンの間だけツールバーにモードが表示されます。',
  'help.guide.company-holidays.step.2': 'グリッドに戻り、ツールバーを「会社休日」モードに切り替えます。',
  'help.guide.company-holidays.step.3': '日をクリックします。琥珀色になり、凡例に表示されます。',
  'help.guide.company-holidays.result':
    '会社休日はプランを統合している全員に表示され、「残り」を減らすことはありません。',
  'help.guide.company-holidays.tip.1':
    '統合しているメンバーは誰でも会社休日を編集できるので、誰が管理するか決めておきましょう。',
  // public-holidays
  'help.guide.public-holidays.title': '祝日を表示する',
  'help.guide.public-holidays.goal': '国や地域の祝日をグリッドに表示します。',
  'help.guide.public-holidays.step.1': '「設定」を開き、「祝日」をオンにします。',
  'help.guide.public-holidays.step.2':
    '「カレンダーを追加」をクリックし、国と、必要なら地域を選びます。色とラベルも設定できます。',
  'help.guide.public-holidays.step.3': '「設定」を閉じます。祝日がグリッドと凡例に表示されます。',
  'help.guide.public-holidays.result': '祝日はカレンダーの色で表示され、付与日数から差し引かれることはありません。',
  'help.guide.public-holidays.tip.1':
    '複数のカレンダーを追加できます。たとえば自分の地域と、統合している同僚の地域など。',
  // school-holidays
  'help.guide.school-holidays.title': '学校休暇を表示する',
  'help.guide.school-holidays.goal': '地域の学校休暇を自分の休みと並べて確認します。',
  'help.guide.school-holidays.step.1': '「設定」を開き、「School Holidays」をオンにします。',
  'help.guide.school-holidays.step.2':
    '「カレンダーを追加」をクリックして国を選びます。国がカレンダーを分けている場合は地域やグループも選びます。',
  'help.guide.school-holidays.step.3': '「設定」を閉じます。各休暇期間の日の下に色付きのバンドが表示されます。',
  'help.guide.school-holidays.result': '学校休暇は表示のみで、誰の付与日数も減らしません。',
  'help.guide.school-holidays.tip.1':
    '地域が見つからない場合は、管理者が「管理」→「カスタマイズ」→「学校の休暇」で手動管理できます。',
  // weekends
  'help.guide.weekends.title': '週末をブロックし、週の始まりを設定する',
  'help.guide.weekends.goal': '週末を集計から外し、慣れた曜日から週を始めます。',
  'help.guide.weekends.step.1': '「設定」を開きます。',
  'help.guide.weekends.step.2': '「週末を除外」をオンにして、週末とみなす曜日を選びます。',
  'help.guide.weekends.step.3': '「週の開始」で月曜または日曜を選びます。',
  'help.guide.weekends.result': 'ブロックされた日はグリッドでグレー表示になり、誤って記録できません。',
  // leave-year
  'help.guide.leave-year.title': '休暇年度を設定する',
  'help.guide.leave-year.goal': '1月〜12月ではなく、会計年度や入社日を起点に付与日数を数えます。',
  'help.guide.leave-year.step.1': '「設定」を開き、「休暇年度」を探します。',
  'help.guide.leave-year.step.2': '「暦年」「会計年度」（開始月日を指定）「入社日」（入社日を指定）から選びます。',
  'help.guide.leave-year.result':
    '付与日数、使用済み、繰り越しがその期間に従い、グリッドはその最初の月から始まります。',
  'help.guide.leave-year.tip.1': 'この設定は個人ごとです。統合プランでも、各自が自分の休暇年度と数値を保持します。',
  // carry-over
  'help.guide.carry-over.title': '未使用日を繰り越す',
  'help.guide.carry-over.goal': '期間末の残りを次の期間に加えます。',
  'help.guide.carry-over.step.1': '「設定」を開きます。',
  'help.guide.carry-over.step.2': '「繰越」をオンにします。',
  'help.guide.carry-over.result': '繰り越し分は全年度で再計算され、付与日数の下に表示されます。',
  'help.guide.carry-over.tip.1': 'オフにすると、すべての繰り越し残高がゼロに戻ります。',
  // invite
  'help.guide.invite.title': '誰かと一緒に計画する',
  'help.guide.invite.goal': '他のTREKユーザーとプランを統合し、お互いの休みを1つのグリッドで見ます。',
  'help.guide.invite.step.1': '「人物」パネルの人物アイコンをクリックします。',
  'help.guide.invite.step.2': 'ユーザーを選んで招待を送ります。',
  'help.guide.invite.step.3': '相手に通知が届き、承認します。それまで招待は保留として表示されます。',
  'help.guide.invite.result':
    '両方のプランが統合されます。それぞれに色が付き、お互いの日を記録でき、すべてがリアルタイムで同期します。',
  'help.guide.invite.tip.1':
    '統合を解除するには、「設定」の「統合を解除」を使います。各自の記録は自分のプランに戻ります。',
  'help.guide.invite.tip.2': '相手に自分の休みを見せるだけでよければ、統合ではなくカレンダーを共有してください。',
  // share-calendar
  'help.guide.share-calendar.title': 'カレンダーを読み取り専用で共有する',
  'help.guide.share-calendar.goal': 'プランへの編集権を渡さずに、いつ休みかを相手に見せます。',
  'help.guide.share-calendar.step.1': '「共有カレンダー」パネルの共有アイコンをクリックします。',
  'help.guide.share-calendar.step.2': 'ユーザーを選んで「共有」をクリックします。承認は不要です。',
  'help.guide.share-calendar.step.3':
    '共有されたカレンダーは同じパネルに表示されます。目のアイコンで非表示に、「共有を停止」で自分の共有を取り消せます。',
  'help.guide.share-calendar.result':
    'あなたの休みは相手のグリッドに色付きのリングとして表示されます。共有した内容は相手側で編集できません。',
  'help.guide.share-calendar.tip.1': '共有と統合は独立しています。一人と統合しながら、他の人に共有することもできます。',
  'help.guide.share-calendar.tip.2': 'リング付きの日にマウスを乗せると、誰がどれだけ休みかがわかります。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlasは世界地図に描かれたあなたの旅の足跡です。旅行で訪れた国はすべて色で塗られ、TREKを使う前に訪れた国は手動で追加できます。ズームインすると地域が表示され、まだ見たい場所の行きたいリストを作り、下部のガラスのパネルで数字を確認できます。',
  'help.ctx.atlas.bullet.1':
    '地図：訪問済みの国はその国だけの色を保ち、予定の国は破線の輪郭、行きたいリストの国は斜線、それ以外はグレーです。国にマウスを乗せると、その国の旅行、場所、最初と最後の訪問が表示されます。',
  'help.ctx.atlas.bullet.2':
    '上部の検索：国名または場所を入力します。国を選ぶと地図がそこへ移動してポップアップが開き、場所を選ぶとその地域に着地するので、そこを訪問済みにできます。',
  'help.ctx.atlas.bullet.3':
    '右上の「予定の国を表示」：今後の旅行の国を表示します。このスイッチは予定の旅行がある間だけ現れます。',
  'help.ctx.atlas.bullet.4':
    '下部のパネル：「統計」タブには国、旅行、場所、都市、日数、大陸、連続記録が、「行きたいリスト」タブにはこれから先に待っているものが並びます。',
  'help.ctx.atlas.bullet.5':
    '地域：ズームレベル5から地図は州や県の表示に切り替わり、それぞれをクリックして訪問済みにしたり削除したりできます。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：アドオンを接続すると、統計の左側のパネルが記録をもとに行きたい場所にチェックを付け、国を追加します。あなたの確認なしに行われることはありません。',
  // mark-country
  'help.guide.mark-country.title': '国を訪問済みにする',
  'help.guide.mark-country.goal': 'TREKを使う前に行った国を追加して、地図とカウントに含めます。',
  'help.guide.mark-country.step.1': '地図上部の検索ボックスに国名を入力します。',
  'help.guide.mark-country.step.2': '一覧から選びます。地図がそこへ移動し、その国のポップアップが開きます。',
  'help.guide.mark-country.step.3': '「訪問済みにする」を選びます。',
  'help.guide.mark-country.result':
    'その国が地図上で色を持ち、「国」が1つ増えます。この色は固定です。ほかの国を追加しても、残りの色が入れ替わることはありません。',
  'help.guide.mark-country.tip.1':
    '地図上のグレーの国をクリックしても同じポップアップが開きます。小さな国には検索が確実な入口です。',
  'help.guide.mark-country.tip.2':
    '手動で訪問済みにした国は、そこへ行く旅行の日程に関係なく、常に訪問済みとして数えられます。',
  // unmark-country
  'help.guide.unmark-country.title': '訪問済みにした国を削除する',
  'help.guide.unmark-country.goal': '手動で訪問済みにした国を地図から外します。',
  'help.guide.unmark-country.step.1':
    '国を検索して選ぶか、地図上でクリックします。自分で訪問済みにした国では、ポップアップが削除するかどうかを尋ねます。',
  'help.guide.unmark-country.step.2': '「削除」で確定します。',
  'help.guide.unmark-country.result': 'その国はグレーに戻り、カウントから外れます。',
  'help.guide.unmark-country.tip.1':
    'この方法で削除できるのは手動で訪問済みにした国だけです。旅行や場所のある国は、それらがある限り残ります。手動で追加した国では、パネル内の詳細カードにも「削除」があります。',
  // country-details
  'help.guide.country-details.title': 'ある国で何をしたかを見る',
  'help.guide.country-details.goal': '訪問済みの国を開き、そこへ連れて行ってくれた旅行に移動します。',
  'help.guide.country-details.step.1': '訪れたことのある国を検索します。',
  'help.guide.country-details.step.2':
    '選びます。地図がそこへ移動し、下部のパネルに国旗、場所、旅行、そして旅行ごとのチップを載せたカードが現れます。',
  'help.guide.country-details.result': '旅行のチップをクリックすると、その旅行がプランナーで開きます。',
  'help.guide.country-details.tip.1': '地図上で国にマウスを乗せると、同じ数字に加えて最初と最後の訪問が表示されます。',
  // planned-countries
  'help.guide.planned-countries.title': 'これから行く国を表示する',
  'help.guide.planned-countries.goal': '今後の旅行の国を、訪問済みとして数えずに地図に表示します。',
  'help.guide.planned-countries.step.1': '右上の「予定の国を表示」をオンにします。隣の数字は待っている国の数です。',
  'help.guide.planned-countries.step.2':
    '予定の国を検索して選びます。パネルには「予定」と表示され、地図のツールチップにはいつ行くかが示されます。',
  'help.guide.planned-countries.result':
    '予定の国は破線の輪郭で表示されるので、すでに行った場所と見間違えることはありません。スイッチは選択を記憶します。',
  'help.guide.planned-countries.tip.1':
    '国はそこへの旅行が始まった時点で訪問済みになります。進行中の旅行も数えられます。日程のない旅行は統計にまったく含まれません。',
  'help.guide.planned-countries.tip.2': 'このスイッチは今後の旅行がある間だけ存在します。',
  // regions
  'help.guide.regions.title': '地域を訪問済みにする',
  'help.guide.regions.goal': '国より細かく、行ったことのある州、省、都道府県を訪問済みにします。',
  'help.guide.regions.step.1':
    '地域が表示されるまで国をズームインします（ズームレベル5から）。国を検索して選べば十分に近づきます。',
  'help.guide.regions.step.2':
    '地域をクリックします。マウスを乗せると名前が表示され、ポップアップには地域とその国が示されます。',
  'help.guide.regions.step.3': '「訪問済みにする」を選びます。',
  'help.guide.regions.result':
    '地域がその国の色で塗られます。地域を訪問済みにすると、まだ訪問済みでなければ国も訪問済みとして数えられます。',
  'help.guide.regions.tip.1':
    '訪問済みの地域をクリックすると「削除」が表示されます。自分で訪問済みにした地域でも、場所によって訪問済みになった地域でも同じです。',
  'help.guide.regions.tip.2': '実際の場所がある地域は自動的に訪問済みになります。そこでやることはありません。',
  // search-place
  'help.guide.search-place.title': '場所を探してその地域を訪問済みにする',
  'help.guide.search-place.goal':
    '都市がどの地域にあるか知らなくても、ミラノを検索してロンバルディアを訪問済みにできます。',
  'help.guide.search-place.step.1':
    '検索ボックスに都市、名所、または住所を入力します。国が先に表示され、一致する場所はその下の「場所」の見出しの下に並びます。',
  'help.guide.search-place.step.2': '場所を選びます。地図がそこへ移動し、その地点がどの地域にあるかを割り出します。',
  'help.guide.search-place.step.3':
    'その地域に対して「訪問済みにする」を選ぶか、まだこれからなら「行きたいリストに追加」を選びます。',
  'help.guide.search-place.result':
    '地域が訪問済みになり、その国も訪問済みになります。地図データに地域情報のない国では、国そのものが対象になります。',
  'help.guide.search-place.tip.1':
    '場所はTREKのほかの画面と同じ検索から来るので、管理者が設定したプロバイダーに従います。',
  // bucket-country
  'help.guide.bucket-country.title': '国を行きたいリストに入れる',
  'help.guide.bucket-country.goal': '行った国とは別に、行きたい国のリストを地図上で直接管理します。',
  'help.guide.bucket-country.step.1': '国を検索して選ぶか、地図上でクリックします。',
  'help.guide.bucket-country.step.2': '「行きたいリストに追加」を選びます。',
  'help.guide.bucket-country.step.3': '時期がすでに決まっていれば月と年を選び、「行きたいリストに追加」で確定します。',
  'help.guide.bucket-country.result':
    'その国は、訪れたときに持つことになる色の斜線で描かれ、パネルの「行きたいリスト」タブに表示されます。',
  'help.guide.bucket-country.tip.1': '国がリストに入ると、同じポップアップに「行きたいリストから削除」が表示されます。',
  'help.guide.bucket-country.tip.2':
    '予定日ごとに1件です。同じ国を異なる2つの月でリストに入れることはできますが、同じ月で2回は入れられません。',
  // bucket-place
  'help.guide.bucket-place.title': '場所を行きたいリストに追加する',
  'help.guide.bucket-place.goal': '憧れの都市、名所、住所を、座標と予定日付きで保存します。',
  'help.guide.bucket-place.step.1': '下部のパネルで「行きたいリスト」タブを開きます。',
  'help.guide.bucket-place.step.2': '「場所を追加」をクリックします。',
  'help.guide.bucket-place.step.3':
    '名前を入力して検索ボタンを押し、一致する候補を選ぶと、場所に座標が付きます。名前だけ入力して検索を省いても構いません。',
  'help.guide.bucket-place.step.4': '必要なら月と年を選び、「追加」をクリックします。',
  'help.guide.bucket-place.result': 'その場所は予定日とともに行きたいリストの先頭に並びます。隣の×で再び削除できます。',
  'help.guide.bucket-place.tip.1':
    '座標のある項目は、あとで記録がそこにいたことを示したときに、Dawarichがチェックを付けてくれるものです。',
  // stats
  'help.guide.stats.title': '統計を読む',
  'help.guide.stats.goal': 'パネルの数字が何を数え、何を数えないかを知ります。',
  'help.guide.stats.step.1':
    '「国」は実際に行った異なる国の数です。予定の国はその隣に表示され、数には含まれません。「旅行」「場所」「日」はすべての旅行の合計です。「都市」は場所の住所から割り出すため、推定値です。',
  'help.guide.stats.step.2':
    '大陸ごとに訪問済みの国の数が表示され、南極は行ったことがあれば列に加わります。次に連続記録（少なくとも1回の旅行がある連続した年数）と、今年の旅行数が続きます。',
  'help.guide.stats.result': '数字は旅行を計画するにつれて自動的に追従します。ここで手入れするものはありません。',
  'help.guide.stats.tip.1':
    '都市は住所のテキストから読み取るだけで検索はしないため、「Osteria Francescana, Italy」のような短い住所や、都道府県で終わる住所では、都市ではなく地域になることがあります。',
  'help.guide.stats.tip.2': '手動で訪問済みにした国は「国」と大陸には数えられますが、旅行、場所、日数は増えません。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '記録から国を追加する',
  'help.guide.dawarich-countries.goal': 'この1年にどの国にいたかを Dawarich に言わせ、確認したものを地図に載せます。',
  'help.guide.dawarich-countries.step.1':
    'Dawarich アドオンが接続されていると、地図の下部、統計の左に、2つのタイルを持つ Dawarich のパネルがあります。「国」をクリックします。',
  'help.guide.dawarich-countries.step.2':
    'ダイアログが「国」タブで開きます。「国を探す」をクリックします。TREK は直近12か月の記録が及ぶ国と都市を1か月ずつ読むので、少し待ってください。Atlas にまだない国はどれも、国旗、都市の数、その最初の都市の名前とともに一覧され、最初からチェックが付いています。行をクリックすると外せます。',
  'help.guide.dawarich-countries.step.3':
    '右下のボタンで確定します。5行にチェックが付いていれば「5か国を追加」と読めます。ダイアログは何か国が追加されたかを伝えます。閉じると地図は読み直されています。',
  'help.guide.dawarich-countries.result':
    '確認した国は地図で色を持ち、「国」に数えられ、Dawarich から来たものとして記録されます。手で付けた印はそのままです。',
  'help.guide.dawarich-countries.tip.1':
    'Atlas がすでに訪問済みとして示している国は、手で付けたものでも、旅行からのものでも、以前の確認からのものでも除かれるので、自分の印が付け替えられることはありません。以前 Atlas から外した国は、ここで確認すると戻ってきます。',
  'help.guide.dawarich-countries.tip.2':
    'TREK が照合できない国名は捨てられず、行の下に一覧され、「もう一度確認」で Dawarich にもう一度尋ねます。一覧の下の注記は直近12か月を確認したと伝えます。この期間は固定です。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '記録から願いにチェックを付ける',
  'help.guide.dawarich-wishes.goal':
    '行きたいリストのどの場所に実際に着いたかを見つけ、それが起きた日付でチェックを付けます。',
  'help.guide.dawarich-wishes.step.1':
    '地図の下部、統計の左にある Dawarich のパネルで「ウィッシュリスト」をクリックします。',
  'help.guide.dawarich-wishes.step.2':
    'ダイアログが「ウィッシュリスト」タブで開きます。「ウィッシュリストを照合」をクリックします。TREK は座標を持つすべての項目について記録を調べます。着いた願いは、どれだけ近づいたか、どれだけ滞在したか、その日付とともに一覧され、最初からチェックが付いています。すでにチェックを付けたものは「チェック済み」と読めます。一覧の下の注記は座標のない項目を数え、ルールもそこにあります。「250 m 以内に 20 分以上滞在すると、願いがかなったとみなします。」',
  'help.guide.dawarich-wishes.step.3':
    '右下のボタンで確定します。2行にチェックが付いていれば「2件にチェックを付ける」と読めます。それからダイアログを閉じ、隣のパネルの「行きたいリスト」タブを開きます。',
  'help.guide.dawarich-wishes.result':
    '各願いは緑のチェックと、今日ではなく滞在した日付を持ちます。ツールチップは「Dawarich の記録からチェックを付けました」と読め、日付をクリックすると取り消せます。',
  'help.guide.dawarich-wishes.tip.1':
    '通り過ぎただけでは数えません。ルールは近さと時間の両方を求め、条件を満たす滞在が複数あれば最も長いものが選ばれます。座標のない願いは照合できないので、名前だけではなく「場所を追加」の検索から場所を追加してください。',
  'help.guide.dawarich-wishes.tip.2':
    '1回の照合は最大50件を、まだチェックの付いていないものから見て、それ以上あればそう伝えます。すでにチェックの付いていた願いは自分の日付を保ちます。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'コレクション',
  'help.ctx.collections.summary':
    'Collectionsは旅行の外にあるあなたの場所ライブラリです。見つけて残しておきたい場所を名前付きのリストにまとめ、各場所には「アイデア」「行きたい」「訪問済み」のいずれかのステータスが付きます。場所は旅行との間でコピーされるだけでリンクはされないので、リストと旅行が互いを変えることはありません。',
  'help.ctx.collections.bullet.1':
    '左のリストレール：自分のリスト、共有されたリスト、承諾待ちの招待、所有するすべてをまとめた「すべての保存済み」、そして上部の「新しいリスト」とファイルからのインポート。',
  'help.ctx.collections.bullet.2':
    '開いているリストのヘッダー：色、カバー、説明、リンク、メンバー、そして右側の「編集」「エクスポート」「共有」の各操作。',
  'help.ctx.collections.bullet.3':
    '場所の上のフィルター行：ステータス、カテゴリ、評価、並び順、ラベルフィルター、場所を追加する+、旅行からの取り込み、一括操作のための「選択」。',
  'help.ctx.collections.bullet.4':
    '場所の行：アバター、名前と住所、ラベルとカテゴリ、そしてワンクリックで切り替わる右端のステータスピル。',
  'help.ctx.collections.bullet.5':
    '右の地図：座標を持つ場所ごとにピンが1つ、リストと地図の切り替え、検索ボックス、ラベルフィルター。ピンをクリックするとその場所が開きます。',
  'help.ctx.collections.bullet.6':
    '詳細シート：行をクリックすると、カバー、カテゴリ、ラベル、ステータス、説明、リンクが表示され、「編集」「旅行にコピー」「リストから削除」が使えます。',
  // create-list
  'help.guide.create-list.title': 'リストを作成する',
  'help.guide.create-list.goal': '色とカバーを付けた名前付きの新しいリストを始め、場所を入れられる状態にします。',
  'help.guide.create-list.step.1': 'リストレールの上部にある「新しいリスト」をクリックします。',
  'help.guide.create-list.step.2':
    'リストに名前を付けて色を選びます。カバー画像、説明、リンクは任意で、あとから「編集」で追加できます。',
  'help.guide.create-list.step.3': '「作成」をクリックします。',
  'help.guide.create-list.result':
    'リストが空の状態で開き、「場所を追加」と「旅行から取り込む」の2つの方法で埋めていけます。',
  'help.guide.create-list.tip.1':
    'カバーは自分でアップロードした画像でも、同じダイアログのUnsplash検索で見つけた写真でもかまいません。',
  // add-place
  'help.guide.add-place.title': '場所を追加する',
  'help.guide.add-place.goal': '場所を探し、名前、カテゴリ、ステータス、メモをまとめて開いているリストに保存します。',
  'help.guide.add-place.step.1': '場所の上のフィルター行にある+をクリックします。',
  'help.guide.add-place.step.2': '検索欄に場所を入力して結果を選びます。名前、住所、座標がそこから入力されます。',
  'help.guide.add-place.step.3':
    'ステータスを設定し、必要ならカテゴリ、説明、リンクも付けて「追加」をクリックします。ダイアログは次の場所のために開いたままになり、「キャンセル」で閉じます。',
  'help.guide.add-place.result': '場所がリストに現れ、座標があれば地図上のピンとしても表示されます。',
  'help.guide.add-place.tip.1':
    '旅行の中からは、場所インスペクターまたは場所メニューの「コレクションに保存」で、旅行を離れずに旅行の場所をリストに入れられます。',
  'help.guide.add-place.tip.2':
    'リストは自分のものか、自分が編集者または管理者であるものに限ります。「すべての保存済み」や閲覧のみのリストには+がありません。',
  // import-from-trip
  'help.guide.import-from-trip.title': '旅行から場所を取り込む',
  'help.guide.import-from-trip.goal': '旅行の場所をひとつずつ保存する代わりに、まとめてリストに持ってきます。',
  'help.guide.import-from-trip.step.1':
    'フィルター行にある雲の矢印付きの取り込みボタンをクリックします。空のリストでは同じ操作が「場所を追加」の隣にあります。',
  'help.guide.import-from-trip.step.2': '自分の旅行を1つ選びます。',
  'help.guide.import-from-trip.step.3':
    '欲しい場所にチェックを付けます。すでにリストにある場所はグレー表示になり、旅行のどの日にも入っていない場所は最初から選択されています。「新しいものだけ」はすでに持っているものを隠します。',
  'help.guide.import-from-trip.step.4': '「取り込む」をクリックします。ボタンには追加される件数が常に表示されます。',
  'help.guide.import-from-trip.result':
    '場所が名前、住所、座標、説明、カテゴリとともにリストへコピーされます。旅行は元のままです。',
  'help.guide.import-from-trip.tip.1':
    '名前または座標が同じ重複は自動的にスキップされるので、二度取り込んでも問題ありません。',
  'help.guide.import-from-trip.tip.2':
    '旅行の場所リストの中では、代わりに選択モードの「コレクションに保存」で、自分で選んだ場所だけをまとめて保存できます。',
  // place-status
  'help.guide.place-status.title': '場所のステータスを設定する',
  'help.guide.place-status.goal': '何がアイデアで、何が候補で、どこへ行ったかを把握します。',
  'help.guide.place-status.step.1':
    '場所の行の右端にあるステータスピルをクリックします。「アイデア」が「行きたい」になります。',
  'help.guide.place-status.step.2':
    'もう一度クリックすると「訪問済み」になり、さらにもう一度で「アイデア」に戻ります。',
  'help.guide.place-status.result':
    'ピルとその色がすぐに変わり、リストの上のステータスフィルターの件数も合わせて更新されます。',
  'help.guide.place-status.tip.1':
    'ステータスはCollectionsだけのものです。場所を旅行にコピーしても一緒には持ち込まれません。',
  'help.guide.place-status.tip.2':
    '旅行からは、「コレクションに保存」がその場所の入っているリストごとにステータスピルを表示し、場所パネルには選択した場所を対象にした「訪問済みにする」操作があります。',
  // place-detail
  'help.guide.place-detail.title': '保存した場所を開く',
  'help.guide.place-detail.goal': '場所についてのすべてを見て、操作します。編集、旅行へのコピー、削除。',
  'help.guide.place-detail.step.1':
    '場所の行をクリックします。詳細シートがリストの横に開き、地図がその場所へ移動します。',
  'help.guide.place-detail.step.2':
    '下部に「編集」「旅行にコピー」「リストから削除」があり、カバーのカメラで自動取得の写真を自分の写真に差し替えられます。',
  'help.guide.place-detail.result':
    '「編集」で名前、カテゴリ、ラベル、住所、座標、説明、リンクがシート内でそのまま編集できるようになります。',
  'help.guide.place-detail.tip.1':
    '場所に固有の画像がない場合、カバーは自動的に取得されます。自分でアップロードする画像はJPG、PNG、GIF、WebPで20MBまでです。',
  'help.guide.place-detail.tip.2':
    '共有リストのメンバーはここで星評価も付けられ、フィルター行の評価フィルターはその平均を使います。',
  // labels
  'help.guide.labels.title': 'ラベルで場所をまとめる',
  'help.guide.labels.goal': '共通のカテゴリとは別に、地区や日付などリスト独自のラベルを付けます。',
  'help.guide.labels.step.1': 'フィルター行のラベルコントロールからラベルマネージャーを開きます。',
  'help.guide.labels.step.2':
    '名前を入力し、色を選んで「ラベルを追加」をクリックします。既存のラベルの名前変更、色変更、削除も同じダイアログで行えます。',
  'help.guide.labels.step.3':
    '「選択」をオンにして場所にチェックを付け、選択バーの「ラベルを割り当て」をクリックします。1つの場所なら詳細シートの「編集」からもラベルを付けられます。',
  'help.guide.labels.step.4':
    'フィルター行でラベルを1つ以上選ぶと、リストと地図がそのいずれかを持つ場所に絞り込まれます。',
  'help.guide.labels.result':
    'ラベルの付いた場所は行にラベルを表示します。ラベルフィルターは閲覧者を含むすべてのメンバーが使えます。',
  'help.guide.labels.tip.1': 'ラベルは作成されたリストだけのものです。場所を別のリストに移動するとラベルは外れます。',
  'help.guide.labels.tip.2': 'ラベルの管理と割り当てにはリストの編集権限が必要です。',
  // filter-select
  'help.guide.filter-select.title': '場所を絞り込んで選択する',
  'help.guide.filter-select.goal': 'リストを絞り込み、多くの場所をまとめて操作します。',
  'help.guide.filter-select.step.1':
    'フィルター行のドロップダウンを使います。ステータス、カテゴリ、最低評価、並び順です。それぞれに残る場所の数が表示されます。',
  'help.guide.filter-select.step.2':
    '「選択」をクリックします。すべての行にチェックボックスが付き、選択バーが現れます。',
  'help.guide.filter-select.step.3':
    '場所にチェックを付けるか、現在絞り込まれているすべてを対象に「すべて選択」を使い、「ラベルを割り当て」「リストに移動」「リストに複製」「旅行にコピー」「削除」のいずれかを選びます。',
  'help.guide.filter-select.result': '操作は選択全体に一度に適用されます。右側の×で選択モードを終了します。',
  'help.guide.filter-select.tip.1':
    '「すべて選択」はフィルターに従うので、「行きたい」で絞り込んでからすべて選択するのが候補をまとめて扱う近道です。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '場所を旅行にコピーする',
  'help.guide.copy-to-trip.goal': '保存した場所を自分の旅行の立ち寄り先にします。',
  'help.guide.copy-to-trip.step.1':
    '「選択」をオンにして場所にチェックを付けるか、1つの場所を開いて詳細シートの「旅行にコピー」を使います。',
  'help.guide.copy-to-trip.step.2': '選択バーの「旅行にコピー」をクリックします。',
  'help.guide.copy-to-trip.step.3': '旅行を選びます。検索ボックスで長い一覧を絞り込めます。',
  'help.guide.copy-to-trip.result':
    '場所は名前、説明、カテゴリ、メモ、価格、座標、写真、タグとともにその旅行の場所リストに入ります。コレクション側は何も変わりません。',
  'help.guide.copy-to-trip.tip.1':
    '共有リストの閲覧者もこれを行えます。リストからコピーするだけで、リストを変えるわけではありません。',
  // share-list
  'help.guide.share-list.title': 'リストを誰かと共有する',
  'help.guide.share-list.goal': 'このTREK上のほかの人と、リストをリアルタイムで一緒に計画します。',
  'help.guide.share-list.step.1': '自分のリストのヘッダーにある「共有」をクリックします。',
  'help.guide.share-list.step.2': 'ユーザーと役割を選びます。「閲覧者」「編集者」「管理者」のいずれかです。',
  'help.guide.share-list.step.3':
    '「招待を送信」をクリックします。相手がリストレールで招待を承諾するまでは「招待保留中」と表示されます。',
  'help.guide.share-list.result':
    '承諾されると、相手側では「共有」の下にリストが現れ、すべての変更がリアルタイムで同期されます。メンバーとその役割は同じダイアログでいつでも変更できます。',
  'help.guide.share-list.tip.1':
    '閲覧者は閲覧、評価、自分の旅行への場所のコピーができます。編集者は場所とラベルの追加と編集ができます。管理者はさらに削除もできます。',
  'help.guide.share-list.tip.2':
    '人を招待したり外したりできるのはオーナーだけです。メンバーは自分で共有リストから抜けられます。',
  // export-list
  'help.guide.export-list.title': 'リストをファイルとしてエクスポートする',
  'help.guide.export-list.goal': '別のTREKにいる人にリストを渡したり、地図アプリに持ち込んだりします。',
  'help.guide.export-list.step.1': 'リストのヘッダーにある「エクスポート」をクリックします。',
  'help.guide.export-list.step.2':
    '別のTREK向けにはラベルとステータス付きの「TREK リスト」を、OsmAnd、Organic Maps、Garmin、その他ウェイポイントを読めるアプリ向けにはGPXを選びます。',
  'help.guide.export-list.result':
    'ファイルがダウンロードされます。共有リストのメンバーなら誰でもエクスポートできます。',
  'help.guide.export-list.tip.1':
    '座標のない場所はGPXのウェイポイントになれないため除外され、TREKが何件除外されたかを伝えます。',
  'help.guide.export-list.tip.2':
    '評価、メンバー、アップロードした写真は意図的に含めません。これらはリストではなくこのTREKに属するものです。',
  // import-file
  'help.guide.import-file.title': 'ファイルからリストをインポートする',
  'help.guide.import-file.goal':
    'TREKのリストファイルまたはGPXファイルを、新しいリストとして、あるいは手持ちのリストに取り込みます。',
  'help.guide.import-file.step.1':
    'リストレールの「新しいリスト」の隣にあるアップロード矢印付きのインポートボタンをクリックします。',
  'help.guide.import-file.step.2':
    'ファイルを選びます。TREKは何かが起こる前に中身を表示します。名前、場所の数、ラベルの数です。',
  'help.guide.import-file.step.3':
    '「新しいリスト」のまま必要なら名前を変えるか、「リストに追加」を選んで編集できるリストに場所を入れ、「インポート」をクリックします。',
  'help.guide.import-file.result':
    'インポートした場所とともにそのリストが開きます。リストへの追加は追加しかしません。すでにある場所はステータス、メモ、ラベルをそのまま保ちます。',
  'help.guide.import-file.tip.1':
    'GPXからは名前のあるウェイポイントがすべて場所になります。トラックは線なので除外され、プレビューにその点の数が示されます。',
  'help.guide.import-file.tip.2':
    'TREKリストでもGPXでもないファイルは理由とともに拒否されます。読めない場所が1つあってもその場所だけがスキップされ、ファイル全体は拒否されません。',
  // edit-list
  'help.guide.edit-list.title': 'リストを編集または削除する',
  'help.guide.edit-list.goal': 'リストの名前、色、カバー、説明、リンクを変更するか、リストを削除します。',
  'help.guide.edit-list.step.1': 'リストのヘッダーにある「編集」をクリックします。オーナーにしか表示されません。',
  'help.guide.edit-list.step.2':
    '好きなところを変えて「保存」をクリックします。左下の「リストを削除」は確認のあと、リストをすべての場所ごと削除します。',
  'help.guide.edit-list.result': 'ヘッダーに新しい色、カバー、説明がすぐに反映されます。',
  'help.guide.edit-list.tip.1': 'リストの削除は取り消せません。コピーを残したいなら先にエクスポートしてください。',
  // all-saved
  'help.guide.all-saved.title': 'ライブラリ全体を検索する',
  'help.guide.all-saved.goal': '所有するすべてのリストを一度に見渡します。',
  'help.guide.all-saved.step.1':
    'リストレールの「すべての保存済み」をクリックします。所有または共同所有するすべてのリストの場所がまとめて表示されます。',
  'help.guide.all-saved.step.2':
    'ほかのリストと同じように検索ボックスとフィルターを使います。「選択」もここで使え、旅行へのコピーができます。',
  'help.guide.all-saved.result':
    '保存したすべての場所を1つのビューで見られます。入れる先のリストが1つに決まらないため、追加やインポートはできません。',
  'help.guide.all-saved.tip.1':
    'ラベルはリストごとのものなので、「すべての保存済み」ではラベルフィルターは提供されません。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '日記',
  'help.ctx.journey.summary':
    '日記は写真を中心にした旅の日記です。どの日記も1つ以上の旅行に結び付いていて、物語、写真、気分、天気を持つエントリーから日ごとに育っていきます。この画面には日記が一覧され、開くと書けます。',
  'help.ctx.journey.bullet.1':
    '上部のバナーには進行中の日記、なければ最新の日記が、エントリー数、写真数、場所数とともに表示されます。「続けて書く」でそれが今日の日付で開きます。',
  'help.ctx.journey.bullet.2':
    'その下には日記ごとに1枚のカードがあり、カバー、サブタイトル、日付、各数が載っています。カードをクリックすると開きます。',
  'help.ctx.journey.bullet.3': 'グリッドの最後のカード「新しい日記を作成」は、旅行から日記を始めます。',
  // create-journey
  'help.guide.create-journey.title': '日記を作成する',
  'help.guide.create-journey.goal': '旅行の日記を始めます。旅行の場所はすでに提案として待っています。',
  'help.guide.create-journey.step.1': 'グリッドの最後のカード「新しい日記を作成」をクリックします。',
  'help.guide.create-journey.step.2':
    '名前と、必要ならサブタイトルを付け、属する旅行にチェックを入れます。カウンターにはいくつの場所が入ってくるかが表示されます。',
  'help.guide.create-journey.step.3': '「日記を作成」をクリックします。',
  'help.guide.create-journey.result':
    '日記が開きます。リンクした旅行のすべての場所が、それが置かれている日ごとに1つずつ提案としてタイムラインに並び、書き込める状態になっています。',
  'help.guide.create-journey.tip.1': '旅行はあとから「日記設定」でさらにリンクできます。',
  'help.guide.create-journey.tip.2': '旅行のない日記も作れます。その場合はエントリーを手動で追加します。',
  // open-journey
  'help.guide.open-journey.title': '日記を開く',
  'help.guide.open-journey.goal': '日記の中に入り、どこで開くかを知ります。',
  'help.guide.open-journey.step.1':
    'カードをクリックします。各カードにはカバー、日付、そして日記に含まれるエントリー、写真、場所の数が表示されています。',
  'help.guide.open-journey.result':
    '進行中の日記は今日の日付で開き、まだ何も書かれていなければ今日より前の最後のエントリーで開きます。終了した日記は先頭で開きます。',
  'help.guide.open-journey.tip.1': 'カバーは、「日記設定」で設定しない限り、日記の最初の写真です。',
  // continue-writing
  'help.guide.continue-writing.title': '進行中の日記を続ける',
  'help.guide.continue-writing.goal': '今いる日記の今日のページに直接飛びます。',
  'help.guide.continue-writing.step.1':
    '上部のバナーにある「続けて書く」をクリックします。バナーには進行中の日記、なければ最新の日記が表示されています。',
  'help.guide.continue-writing.result':
    '日記が今日の日付で開きます。まだ何も書かれていなければ、今日より前の最後のエントリーで開きます。',
  'help.guide.continue-writing.tip.1': 'バナーはまだ日記のない旅行の提案も出します。「閉じる」でその提案を隠せます。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '日記帳',
  'help.ctx.journey-detail.summary':
    '開いている1つの日記です。左にタイムラインが日ごとに並び、右のマップにはすべてのエントリーと、リンクした旅行の場所が表示されます。日記に何かを加えるものはすべて上部にあり、ヘッダーには各数、「Studio」、提案のスイッチ、「日記設定」があります。',
  'help.ctx.journey-detail.bullet.1':
    'ヘッダー：カバー、タイトルとサブタイトル、日数、場所数、エントリー数、写真数、そして右側に「Studio」、提案のスイッチ、「日記設定」。',
  'help.ctx.journey-detail.bullet.2':
    'ツールバー：「タイムライン」と「ギャラリー」のタブ、「この旅を検索」、「エントリーを追加」。',
  'help.ctx.journey-detail.bullet.3':
    'タイムライン：日ごとに1つのセクションがあり、＋でその日にエントリーを追加できます。写真、気分、天気、物語を載せたエントリーのカード、そして旅行からの提案が薄い表示で「この提案を見送る」付きで並びます。',
  'help.ctx.journey-detail.bullet.4':
    'マップ：エントリーはピンとして日付順に破線でつながれ、旅行の場所と、それらの旅行に取り込んだGPXトラックも表示されます。',
  'help.ctx.journey-detail.bullet.5':
    '「日記設定」：カバー、名前とサブタイトル、マップ上のトラック、記録の項目、見送った提案、リンクした旅行、参加者、公開共有、アーカイブと削除。',
  'help.ctx.journey-detail.bullet.6':
    '長いタイムラインの上には2つの丸いボタンが浮かびます。先頭へ戻る、と最後のエントリーへ飛ぶ、です。',
  // add-entry
  'help.guide.add-entry.title': 'エントリーを書く',
  'help.guide.add-entry.goal': 'タイトル、本文、気分、天気を持つ1日の物語を追加します。',
  'help.guide.add-entry.step.1':
    'ツールバーの「エントリーを追加」をクリックするか、日のヘッダーにある＋をクリックしてその日から始めます。',
  'help.guide.add-entry.step.2':
    'その瞬間に名前を付けて物語を書きます。テキストの上のツールバーで、太字、斜体、見出し、引用、リンク、リストをMarkdownで追加できます。',
  'help.guide.add-entry.step.3':
    '気分と天気を選び、日付を確認し、必要なら場所をピン留めします。場所を検索するか、現在地を使います。',
  'help.guide.add-entry.step.4': '「保存」をクリックします。',
  'help.guide.add-entry.result':
    'エントリーがタイムラインのその日に、そしてマップにピンとして現れます。ヘッダーの各数が更新されます。',
  'help.guide.add-entry.tip.1': '提案に書き込む場合も同じエディターで、場所がすでに設定されています。',
  'help.guide.add-entry.tip.2':
    '下部のタグは「hidden gem」や「best meal」のような自由なテキストで、検索で見つかります。',
  // entry-photos
  'help.guide.entry-photos.title': 'エントリーに写真と動画を追加する',
  'help.guide.entry-photos.goal': '1日に写真を載せます。最初の1枚がエントリーのカバーになります。',
  'help.guide.entry-photos.step.1': 'カードの⋯からエントリーのメニューを開き、「編集」を選びます。',
  'help.guide.entry-photos.step.2':
    '「写真をアップロード」をクリックしてファイルを選びます。「ギャラリーから」は日記のギャラリーにすでにある写真を取り込み、「External photos」は接続済みのImmichまたはSynologyのライブラリからその日の写真を探します。',
  'help.guide.entry-photos.step.3': '写真にマウスを乗せて「1番目にする」でカバーを選び、「保存」をクリックします。',
  'help.guide.entry-photos.result': '写真がカードとギャラリーに表示されます。最初の1枚がどこでもサムネイルになります。',
  'help.guide.entry-photos.tip.1':
    '動画も同じ方法でエントリーに載せられます。mp4、m4v、webm、movで500MBまで、アップロードしたままの形で保存されます。',
  'help.guide.entry-photos.tip.2':
    'iPhoneのHEICファイルはアップロード時にJPEGへ変換され、GPSとカメラのメタデータは失われます。',
  // suggestions
  'help.guide.suggestions.title': '提案を使う、または見送る',
  'help.guide.suggestions.goal': '旅行の場所をエントリーに変え、書かないものを片付けます。',
  'help.guide.suggestions.step.1':
    '提案は場所の名前が斜体で書かれた薄いカードです。クリックすると、場所と日がすでに設定されたエディターが開きます。',
  'help.guide.suggestions.step.2':
    '使わないカードでは「この提案を見送る」をクリックします。削除されずにタイムラインから消え、旅行の同期でも再び提案されません。',
  'help.guide.suggestions.step.3':
    '気が変わったら、「日記設定」に見送った数が表示され、「見送った提案を戻す」ですべて戻せます。',
  'help.guide.suggestions.result':
    'タイムラインには書くつもりのものだけが残ります。読んでいる間は、ヘッダーのスイッチですべての提案を一度に隠せます。',
  'help.guide.suggestions.tip.1': '2日にまたがる場所は、それぞれの日に提案が出ます。',
  'help.guide.suggestions.tip.2': '提案は統計に数えられません。書いたエントリーだけが数えられます。',
  // add-on-day
  'help.guide.add-on-day.title': '過ぎた日にエントリーを追加する',
  'help.guide.add-on-day.goal': 'すでに過ぎた日のことを、あとで日付を直さずに書きます。',
  'help.guide.add-on-day.step.1': 'その日のヘッダーにある＋をクリックします。',
  'help.guide.add-on-day.step.2': 'その日付が設定された状態でエディターが開きます。いつも通り書いて「保存」します。',
  'help.guide.add-on-day.result': 'エントリーはすぐに正しい日に入ります。',
  'help.guide.add-on-day.tip.1': '同じ日の中では、エントリーのメニューにある矢印で前後に動かせます。',
  // pros-cons
  'help.guide.pros-cons.title': '評価を加える',
  'help.guide.pros-cons.goal': '良かったことと良くなかったことで1日をまとめます。',
  'help.guide.pros-cons.step.1':
    'エディターで物語の下にある「良かった点・気になった点」を探します。「良かった点」または「気になった点」に項目を入力し、次の項目は「追加」で加えます。',
  'help.guide.pros-cons.step.2': '保存します。評価はカードに2つの短いリストとして表示されます。',
  'help.guide.pros-cons.result': '物語の下に、良し悪しがひと目で分かります。',
  'help.guide.pros-cons.tip.1':
    '評価を使わない日記では、「日記設定」の「記録の項目」でこのセクションをオフにできます。',
  // search-journey
  'help.guide.search-journey.title': '長い日記から探す',
  'help.guide.search-journey.goal': '何週間分もスクロールせずに、目当てのエントリーにたどり着きます。',
  'help.guide.search-journey.step.1':
    'ツールバーの「この旅を検索」に入力します。入力に合わせてタイムラインが、タイトル、物語、場所、タグを対象に絞り込まれます。アクセント記号や大文字小文字は区別されません。',
  'help.guide.search-journey.step.2':
    'ヘッダーの提案のスイッチは、読んでいる間、未記入のカードを隠します。タイムラインが長くなると、下端の上に2つの丸いボタンが浮かびます。先頭へ戻る、と最後のエントリーへ飛ぶ、です。',
  'help.guide.search-journey.result': '一致するエントリーだけが残ります。ボックスを空にすると再びすべて表示されます。',
  'help.guide.search-journey.tip.1': '進行中の日記は今日の日付で開くので、現在のページはたいてい最初から見えています。',
  'help.guide.search-journey.tip.2':
    'タグも対象です。「hidden gem」で検索すると、そのタグの付いたエントリーがすべて見つかります。',
  // gallery-map
  'help.guide.gallery-map.title': 'ギャラリーとマップを見る',
  'help.guide.gallery-map.goal': '日記全体を写真として、そしてマップ上の場所として眺めます。',
  'help.guide.gallery-map.step.1':
    'ツールバーで「ギャラリー」に切り替えます。すべてのエントリーのすべての写真に加え、ギャラリーへ直接アップロードした写真が並びます。クリックするとライトボックスで開きます。',
  'help.guide.gallery-map.step.2':
    '右のマップには、エントリーが日付順にピンとして、リンクした旅行の場所、そしてそれらの旅行に取り込んだGPXトラックが、プランナーでの色のまま表示されます。',
  'help.guide.gallery-map.result':
    'トラックにマウスを乗せると名前が表示されます。エントリー間の破線はTREKが描いたもので、トラックは実際に記録した経路です。',
  'help.guide.gallery-map.tip.1': 'トラックは「日記設定」で日記ごとにオフにできます。',
  'help.guide.gallery-map.tip.2':
    '位置情報のあるギャラリーの写真は、「ギャラリー」と「マップ」の両方を共有している場合、公開マップにも表示されます。',
  // entry-fields
  'help.guide.entry-fields.title': '記録の項目をオフにする',
  'help.guide.entry-fields.goal': 'エディターをこの日記で使うものだけにします。',
  'help.guide.entry-fields.step.1': 'ヘッダーから「日記設定」を開きます。',
  'help.guide.entry-fields.step.2': '「記録の項目」で「気分」「天気」「良かった点・気になった点」をオフにします。',
  'help.guide.entry-fields.result':
    'エディターはそれらを求めなくなります。書いたものは失われません。項目を再びオンにすると保存されていた値が表示され、共有した日記でも同じ項目が隠れます。',
  'help.guide.entry-fields.tip.1': 'スイッチは日記ごとなので、出張と休暇で設定を変えられます。',
  // link-trip
  'help.guide.link-trip.title': '別の旅行をリンクする',
  'help.guide.link-trip.goal': '2つ目の旅行の場所を提案として日記に取り込みます。',
  'help.guide.link-trip.step.1': 'ヘッダーから「日記設定」を開きます。',
  'help.guide.link-trip.step.2': 'リンクした旅行の下にある「旅行を追加」をクリックします。',
  'help.guide.link-trip.step.3': '旅行を選びます。',
  'help.guide.link-trip.result':
    'その旅行の場所がそれぞれの日に提案としてタイムラインに入り、GPXトラックがマップに加わります。',
  'help.guide.link-trip.tip.1': 'リンクした旅行の横の×でリンクを解除できます。書いたエントリーは残ります。',
  'help.guide.link-trip.tip.2': 'ある日のエントリーは、その日をいくつの旅行がカバーしていても1回しか数えられません。',
  // share-public
  'help.guide.share-public.title': '日記を公開で共有する',
  'help.guide.share-public.goal': 'TREKのアカウントを持たない人に読み取り専用のリンクを渡します。',
  'help.guide.share-public.step.1': '「日記設定」を開き、「公開共有」を探します。',
  'help.guide.share-public.step.2': '「共有リンクを作成」をクリックします。',
  'help.guide.share-public.step.3':
    '訪問者に見せるものを選びます。「タイムライン」「ギャラリー」「マップ」は別々のスイッチです。「コピー」でリンクがクリップボードに入ります。',
  'help.guide.share-public.result':
    'リンクを持つ人は有効にしたセクションだけを見られます。「記録の項目」でオフにした項目はそこでも隠れたままです。',
  'help.guide.share-public.tip.1':
    '写真が公開マップに出るのは「ギャラリー」と「マップ」の両方がオンのときだけです。「マップ」がオフなら、座標はサーバーを出る前に取り除かれます。',
  'help.guide.share-public.tip.2': '共有を終えるには同じ場所でリンクを削除します。',
  // contributors
  'help.guide.contributors.title': '一緒に書く',
  'help.guide.contributors.goal': '旅の仲間が自分のエントリーと写真を追加できるようにします。',
  'help.guide.contributors.step.1': '「日記設定」を開き、参加者までスクロールします。',
  'help.guide.contributors.step.2': '「参加者を招待」をクリックし、名前またはメールでユーザーを検索します。',
  'help.guide.contributors.step.3': '役割を選んで確定します。',
  'help.guide.contributors.result':
    '日記が相手の一覧に現れ、相手のエントリーには相手の名前が付きます。参加者を外すには横の×を使います。',
  'help.guide.contributors.tip.1': '参加者はこのTREK上の人向けです。それ以外の人には公開リンクがあります。',
  // studio
  'help.guide.studio.title': '日記をフォトブックにレイアウトする',
  'help.guide.studio.goal': '日記を印刷できるページにします。',
  'help.guide.studio.step.1': 'ヘッダーの「Studio」をクリックします。デザイナーが日記の上に開きます。',
  'help.guide.studio.step.2': '上部バーの左にある日記の名前が戻る道です。元いた場所に戻れます。',
  'help.guide.studio.result':
    '左にページのレール、作業台に見開き、右にプロパティが並びます。「Auto layout」がエントリーからブックを組み立て、「Export」で印刷用のPDFができます。',
  'help.guide.studio.tip.1': 'Studioには幅1024px以上のウィンドウが必要で、スマートフォンでは提供されません。',
  'help.guide.studio.tip.2':
    'ブックは日記のアクセス権を引き継ぎます。日記を読める人は開け、編集できる人は保存できます。',
  // archive-journey
  'help.guide.archive-journey.title': '日記をアーカイブまたは削除する',
  'help.guide.archive-journey.goal': '終わった日記を閉じるか、完全に削除します。',
  'help.guide.archive-journey.step.1': '「日記設定」を開きます。',
  'help.guide.archive-journey.step.2':
    '一番下の「日記をアーカイブ」で終了してアーカイブ済みにし、「日記を復元」で戻せます。「削除」は確認のあと、すべてのエントリーと写真ごと削除します。',
  'help.guide.archive-journey.result':
    'アーカイブした日記は読むことも共有することもできます。今日の日付で開かなくなるだけです。',
  'help.guide.archive-journey.tip.1': '削除は元に戻せません。日記がリンクしていた旅行には影響しません。',
  'help.guide.archive-journey.tip.2': 'カバー、名前、サブタイトルは同じダイアログの上部にあります。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio は旅を印刷できるフォトブックとしてレイアウトします。日記の上に開き、左にページのサイドバーとコンテンツ、中央に作業中の見開き、右にそのプロパティが並びます。Auto layout がエントリーから最初の下書きを作り、その先は移動、切り抜き、スタイルの変更まですべてあなたの手で行え、どの操作も元に戻せます。',
  'help.ctx.journey-studio.bullet.1':
    '上部バー：Back to the journey、Book view、Undo と Redo、Page format、Auto layout、Export。タイトルの横の「保存しました」マークで、本が保存された時点がわかります。',
  'help.ctx.journey-studio.bullet.2':
    '左のサイドバーには5つのセクションがあります。Pages、Content（旅の写真とエントリー）、Elements（テキスト、図形、線、グリッド、フレーム、アイコン）、「旅」（旅から作られる地図、国、国旗、マーク）、Layouts です。',
  'help.ctx.journey-studio.bullet.3':
    '作業エリア：塗り足しと安全領域の余白付きの現在の見開き、その下のズームバー、Fit to view、右端の「この見開きをダウンロード」。',
  'help.ctx.journey-studio.bullet.4':
    '右の Properties：選択中のものの位置とサイズ、切り抜きと焦点、Fill か Fit か、見た目、角、フレーム、重なり順、ロック。何も選択していないときはノンブルとドキュメントです。',
  'help.ctx.journey-studio.bullet.5':
    '本は製本された本と同じ形をしています。表紙、1ページだけの最初のページ、見開き、1ページだけの最後のページ、裏表紙です。ノンブルは最初のページから数え、表示のとおりに印刷されます。',
  'help.ctx.journey-studio.bullet.6':
    '複数人で同時にデザインできます。全員が他の人のポインターを名前付きで見られ、ほかの人が変更したバージョンに保存すると、相手の作業を上書きする代わりに競合として返されます。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '本を自動で組み立てる',
  'help.guide.studio-auto-layout.goal': '日記のエントリーと写真から、完成した最初の下書きをワンクリックで得ます。',
  'help.guide.studio-auto-layout.step.1': '上部バーの Auto layout をクリックします。',
  'help.guide.studio-auto-layout.step.2':
    '「本全体」を選びます。タイトルとページ設定は残したまま、すべてのページを置き換えます。「このページ」は画面上の見開きだけを作り直し、エントリーから生まれた見開きでのみ表示されます。',
  'help.guide.studio-auto-layout.step.3':
    'Pages のサイドバーを見渡します。前の方が良ければ、Undo でレイアウト全体を元に戻せます。',
  'help.guide.studio-auto-layout.result':
    'エントリーごとに1つの見開きが順番に並び、写真、タイトル、ストーリーが配置されます。各要素は、編集するまでエントリーに追従し続けます。',
  'help.guide.studio-auto-layout.tip.1': 'どちらも通常の取り消しステップなので、気軽に試せます。',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout がエントリーに結び付けた要素は、Properties で触るまでそのエントリーの編集に追従します。触るとリンクが切れます。',
  // studio-pages
  'help.guide.studio-pages.title': '見開きを追加、移動、削除する',
  'help.guide.studio-pages.goal': '本をページごとに形作ります。',
  'help.guide.studio-pages.step.1':
    'サイドバーの Pages を開きます。サムネイルは本の順番どおりです。表紙、最初のページ、見開き、最後のページ、裏表紙。',
  'help.guide.studio-pages.step.2':
    '一番下の「ページを追加」は、最後のページの前に新しい見開きを置きます。2つのサムネイルの間の + は、ちょうどその位置に挿入します。',
  'help.guide.studio-pages.step.3':
    'サムネイルにマウスを乗せると操作が表示されます。「前へ移動」「後ろへ移動」「ページを複製」「ページを削除」です。サムネイルをクリックすると、その見開きが作業エリアに開きます。',
  'help.guide.studio-pages.result':
    '表紙、最初と最後のページ、裏表紙は動きません。新しい見開きは必ずその間に入ります。',
  'help.guide.studio-pages.tip.1': '上部バーの Book view は、製本されるときの姿で本全体を紙面として表示します。',
  'help.guide.studio-pages.tip.2':
    'ノンブルは、何も選択していない状態で Properties の「ドキュメント」からオンにします。',
  // studio-layouts
  'help.guide.studio-layouts.title': '見開きにレイアウトを適用する',
  'help.guide.studio-layouts.goal': '見開きに、写真とテキストのフレームの出来合いの配置を与えます。',
  'help.guide.studio-layouts.step.1':
    'サイドバーの Layouts を開きます。見開き用のレイアウトが13種類、表紙、裏表紙、単ページ用に別のセットがあります。',
  'help.guide.studio-layouts.step.2':
    '1つクリックします。作業エリアの見開きがそのフレームを受け取り、すでにあった写真とテキストはその中に流し込まれます。',
  'help.guide.studio-layouts.result':
    '空のフレームはコンテンツを待っています。Content から写真をドラッグするか、Add to this page を使います。',
  'help.guide.studio-layouts.tip.1': 'レイアウトもほかと同じ取り消しステップです。',
  // studio-content
  'help.guide.studio-content.title': '写真とエントリーをページに置く',
  'help.guide.studio-content.goal': '旅そのものの素材を見開きに持ち込みます。',
  'help.guide.studio-content.step.1':
    'サイドバーの Content を開きます。Photos には旅のすべての写真、Entries にはテキスト付きのエントリーが並びます。',
  'help.guide.studio-content.step.2':
    '写真を見開きか空のフレームにドラッグするか、その下の Add to this page をクリックします。「写真をアップロード」は、まだ旅にない写真を追加します。',
  'help.guide.studio-content.step.3':
    'エントリーの下の Title、Story、Place は、そのテキストをテキスト要素としてページに置きます。日付と座標はマークとして入り、エントリーの写真はそのすぐそこに並びます。',
  'help.guide.studio-content.result':
    'ドロップした写真は写真要素になります。テキストは編集するまでエントリーに追従し続けます。',
  'help.guide.studio-content.tip.1': 'Content の上部の検索ボックスは、両方のリストを絞り込みます。',
  'help.guide.studio-content.tip.2':
    'デスクトップからファイルを作業エリアにドロップすると、アップロードと配置が一度に済みます。',
  // studio-elements
  'help.guide.studio-elements.title': 'テキスト、図形、アイコンを追加する',
  'help.guide.studio-elements.goal': '写真とストーリー以外で見開きを飾ります。',
  'help.guide.studio-elements.step.1': 'サイドバーの Elements を開きます。',
  'help.guide.studio-elements.step.2':
    '見出しやキャプション用のテキストスタイル、図形、線、グリッド、フレームスタイル付きの空のフレーム、検索できるライブラリのアイコンのどれかをクリックします。それぞれ見開きの中央に置かれ、すぐに動かせます。',
  'help.guide.studio-elements.result':
    'テキスト要素をダブルクリックすると入力できます。Properties にフォント、太さ、サイズ、字間、揃えがあります。',
  'help.guide.studio-elements.tip.1': 'フレームは空の写真枠です。写真は後からドロップできます。',
  // studio-travel
  'help.guide.studio-travel.title': '地図、国旗、数字を追加する',
  'help.guide.studio-travel.goal': '旅そのものをページ上の数字に変えます。',
  'help.guide.studio-travel.step.1': 'サイドバーの「旅」を開きます。',
  'help.guide.studio-travel.step.2':
    '追加するものを選びます。エントリーのルートマップ、国の輪郭、国リストか国グリッド、国旗、日付・日数・距離のマーク、旅全体のサマリー。それぞれ旅のデータから作られ、データと一緒に更新されます。',
  'help.guide.studio-travel.result': '要素が見開きに現れます。Properties でスタイルを、地図なら範囲を調整します。',
  'help.guide.studio-travel.tip.1':
    'マークは見開きの元になったエントリーに追従するので、自動レイアウトした見開きの日付マークは最初からその日を示します。',
  // studio-properties
  'help.guide.studio-properties.title': '選択したものを編集する',
  'help.guide.studio-properties.goal': 'インスペクターで要素を移動、切り抜き、スタイル設定、重ね順の変更をします。',
  'help.guide.studio-properties.step.1':
    '見開きの要素をクリックします。サイズと回転のハンドルが表示され、ドラッグで移動できます。',
  'help.guide.studio-properties.step.2':
    '右の Properties は選択に追従します。位置とサイズ、フレーム内に残す部分を決める焦点付きの Crop、Fill か Fit、Look のフィルター、Corner の半径、「フレーム」のスタイル、重なり順、Lock です。',
  'help.guide.studio-properties.step.3':
    '「複製」と Delete はインスペクターの上部にあります。上部バーの Undo でどれも元に戻せます。',
  'help.guide.studio-properties.result':
    'ロックした要素はページ上でつかめなくなるので、周りを作業している間も完成したレイアウトが崩れません。',
  'help.guide.studio-properties.tip.1':
    'Shift を押しながらクリックすると複数の要素を選択でき、インスペクターでまとめて編集できます。',
  'help.guide.studio-properties.tip.2':
    'Auto layout が置いた要素を編集すると、エントリーとのリンクが切れ、そのエントリーの以後の変更に追従しなくなります。',
  // studio-format
  'help.guide.studio-format.title': 'ページ判型を選ぶ',
  'help.guide.studio-format.goal': 'レイアウトがサイズに依存する前に、本を印刷するサイズを決めます。',
  'help.guide.studio-format.step.1': '上部バーの Page format をクリックします。',
  'help.guide.studio-format.step.2':
    'Square 21 × 21 cm、Square 30 × 30 cm、A4 または A5 の横向きか縦向きを選ぶか、幅と高さをミリ単位で入力します。塗り足しと安全領域はその下にあります。',
  'help.guide.studio-format.result':
    'すべての見開きがそのサイズで描かれ、初期設定では塗り足し 3 mm、安全領域 5 mm です。',
  'help.guide.studio-format.tip.1':
    '先に判型を変えてから Auto layout を実行します。レイアウトは、その時点のサイズに合わせて作られます。',
  'help.guide.studio-format.tip.2': '印刷所に塗り足しと安全領域の値を聞いて、それを入力してください。',
  // studio-export
  'help.guide.studio-export.title': '本を PDF として書き出す',
  'help.guide.studio-export.goal': '印刷用のファイル、または画面で読むためのファイルを作ります。',
  'help.guide.studio-export.step.1': '上部バーの Export をクリックします。',
  'help.guide.studio-export.step.2':
    '「単ページ」（1枚に1ページずつ読む順に、印刷所が求める形）か、「見開き」（本を開いたときのまま2ページずつ）を選びます。「トンボ」は各辺に塗り足しを加え、断裁位置を示します。',
  'help.guide.studio-export.step.3':
    '「印刷ビュー」をクリックします。ブラウザーがページを開き、「PDFとして保存」でファイルになります。',
  'help.guide.studio-export.result': 'ダイアログに表示された枚数どおりの、設定した判型の PDF ができます。',
  'help.guide.studio-export.tip.1': 'PDF の作成は Studio 自体と同じく、デスクトップ限定です。',
  'help.guide.studio-export.tip.2':
    '校正用にはトンボなしの「見開き」を、印刷所にはトンボ付きの「単ページ」を書き出します。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '見開きを別の本で再利用する',
  'help.guide.studio-spread-file.goal': '気に入ったデザインを、ある旅の本から別の旅の本へ持ち込みます。',
  'help.guide.studio-spread-file.step.1':
    '見開きを作業エリアに開いた状態で、ズームバーの右端の「この見開きをダウンロード」をクリックします。ファイルにはデザインだけが入り、写真は入りません。',
  'help.guide.studio-spread-file.step.2':
    'もう一方の本で Pages を開き、「ページを追加」の隣の「読み込む」をクリックしてファイルを選びます。',
  'help.guide.studio-spread-file.result':
    '見開きがフレームとテキストスタイルごと届きます。新しい旅の写真をフレームにドロップしてください。',
  'help.guide.studio-spread-file.tip.1': '見開きのデザインでないファイルは、理由付きで拒否されます。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '設定',
  'help.ctx.settings.summary':
    'あなた専用の設定で、左のサイドバーにトピックごとのタブが並びます。ほとんどのスイッチは切り替えた瞬間に反映されます。下部に「保存」ボタンのあるフォームは、そのボタンを押すまで待ちます。ここで変えたものが、ほかの人のTREKを変えることはありません。',
  'help.ctx.settings.bullet.1':
    '左のサイドバー：「表示」「Appearance」「地図」「通知」「連携」「オフライン」「アカウント」。「プラグイン」はプラグインが1つでもインストールされると現れ、「情報」は運営者が外していないかぎり現れます。',
  'help.ctx.settings.bullet.2':
    '「表示」は言語、単位、通貨、アプリが最初に開く画面。「Appearance」はテーマ、色、文字サイズ、ダッシュボードのウィジェットです。',
  'help.ctx.settings.bullet.3':
    '「地図」は描画エンジンとそのスタイルを、「通知」はあなたに届くチャンネルを、「連携」は写真ライブラリ、APIキー、MCPを、「オフライン」はアプリがこの端末に保持するものを選びます。',
  'help.ctx.settings.bullet.4':
    '「アカウント」にはプロフィール、パスワード、二要素認証、パスキー、そしてアカウントの削除があります。',
  'help.ctx.settings-display.title': '表示',
  'help.ctx.settings-display.summary':
    '言語、単位、通貨、地図と予約の振る舞い、そしてTREKが最初に開く画面。ここでの変更はすべて即座に反映されます。',
  'help.ctx.settings-display.bullet.1':
    '「Language & region」：インターフェースの言語、時刻形式、週の最初の曜日、表示通貨、距離と温度の単位。',
  'help.ctx.settings-display.bullet.2':
    '「Travel & map」：予約ルートを常に地図に表示、スポットを探すピル、宿泊先を起点にしたルート最適化、予約コードのぼかし、予約ルートのラベル表示。',
  'help.ctx.settings-display.bullet.3':
    '「起動」：TREKをダッシュボードで開くか進行中の旅行で開くか、そして旅行のどのタブを最初に表示するか。',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'このアカウントでのTREKの見た目：ライトかダークか、アクセントカラー、ガラス効果と動き、文字サイズ、ダッシュボードに表示するウィジェット。すべてその場で反映され、サインインしているどの端末にも及びます。',
  'help.ctx.settings-appearance.bullet.1':
    '「Theme」：「ライト」「ダーク」「自動」、そして「Color scheme」と自分で選ぶ「Custom accent」。',
  'help.ctx.settings-appearance.bullet.2':
    '「Readability」：「Transparency」「Reduce motion」「Density」「Text size」、さらに階層ごとの詳細なサイズ。',
  'help.ctx.settings-appearance.bullet.3':
    '「Dashboard widgets」：ウィジェットごとに1つのスイッチを、「Desktop」と「Mobile」で別々に設定します。',
  'help.ctx.settings-appearance.bullet.4': '下部の「Reset to defaults」ですべてが元に戻ります。',
  'help.ctx.settings-map.title': '地図',
  'help.ctx.settings-map.summary':
    'どのエンジンがどのスタイルで地図を描くか。Leafletは従来型のラスター地図、MapLibreはトークンなしでベクタータイルを描画し、Mapboxは自分のトークンで3Dの建物と地形を加えます。',
  'help.ctx.settings-map.bullet.1':
    '「地図プロバイダー」：Leaflet、MapLibre、Mapboxのいずれかで、それぞれに必要なものが1行で示されます。',
  'help.ctx.settings-map.bullet.2':
    '「地図スタイル」と「地図テンプレート」：タイルの見た目に加えて、プロバイダーが求めるトークンやキー。',
  'help.ctx.settings-map.bullet.3':
    'アンチエイリアスと地球儀投影のための「高品質モード」。「地図を保存」で選択が書き込まれます。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'アプリの外でTREKがあなたに届く先：このデバイスへのプッシュ通知、ntfyのトピック、Webhook、またはプラグインが提供するチャンネル。チャンネルの下では、イベントごとの行が何をどこへ送るかを決めます。',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy：トピック、任意で自前のサーバー、任意でアクセストークン。「テスト」ですぐに1件送信できます。',
  'help.ctx.settings-notifications.bullet.2': 'Webhook：すべてのイベントをJSONで受け取る1つのURL。「テスト」付きです。',
  'help.ctx.settings-notifications.bullet.3':
    'このデバイスのプッシュ通知：「このデバイスでオンにする」は今使っているブラウザーだけが対象なので、スマートフォンやパソコンごとに行います。「テスト送信」はそのすべてに届きます。',
  'help.ctx.settings-notifications.bullet.4':
    '設定の行：イベントごとに、どのチャンネルがオンか。プラグインのチャンネルは設定が済むまで「設定する」と表示されます。',
  'help.ctx.settings-integrations.title': '連携',
  'help.ctx.settings-integrations.summary':
    '外からTREKにつながるものすべて：日記のための写真ライブラリ、スクリプトのためのAPIキー、そしてAIアシスタントのためのMCPエンドポイントとそのトークンやOAuthクライアント。',
  'help.ctx.settings-integrations.bullet.1':
    '写真プロバイダー：ImmichとSynology Photos。それぞれにURLとキー、「接続をテスト」と「保存」があります。',
  'help.ctx.settings-integrations.bullet.2':
    '「API キー」：あなたの名前でTREK APIを呼び出すスクリプトやほかのツールのための個人キー。',
  'help.ctx.settings-integrations.bullet.3':
    '「MCP設定」：エンドポイント、コピーするだけのクライアント設定、そしてAPIトークン。',
  'help.ctx.settings-integrations.bullet.4':
    '「OAuth 2.1 クライアント」：TREKを通してログインするアプリ。リダイレクトURI、許可スコープ、マシンクライアント、有効なセッションを扱います。',
  'help.ctx.settings-offline.title': 'オフライン',
  'help.ctx.settings-offline.summary':
    '接続がなくても旅行を開けるようにTREKがこの端末に保持するもの、そしてオフラインで行った変更がほかの場所での変更と衝突したときに何が起こるか。',
  'help.ctx.settings-offline.bullet.1':
    '「オフラインモード」：「オフラインモードを強制」はネットワークが切れたかのようにアプリを振る舞わせます。テストや従量制の接続に使います。',
  'help.ctx.settings-offline.bullet.2':
    '「オフラインの準備」：「オフライン用にダウンロード」で旅行とその地図タイルを今すぐ取得します。',
  'help.ctx.settings-offline.bullet.3':
    '「オフラインで保存する内容」：地図タイルのオンとオフ、そして旅行ごとのスイッチ。',
  'help.ctx.settings-offline.bullet.4':
    '「同期の競合」と「オフラインキャッシュ」：衝突時の方針、保留中と失敗した件数、「今すぐ再同期」と「キャッシュを消去」。',
  'help.ctx.settings-account.title': 'アカウント',
  'help.ctx.settings-account.summary':
    'このTREKでのあなたが誰で、どうサインインするか：プロフィールとアバター、パスワード、二要素認証、パスキー、そして一番下にアカウントの削除。',
  'help.ctx.settings-account.bullet.1':
    'プロフィール：ユーザー名、メール、アバター。「プロフィールを保存」で保存します。',
  'help.ctx.settings-account.bullet.2':
    '「パスワード変更」：現在のパスワード、新しいパスワードを2回、そして「パスワード更新」。',
  'help.ctx.settings-account.bullet.3':
    '認証アプリとバックアップコードによる「二要素認証（2FA）」。パスワードなしでサインインするための「パスキー」。',
  'help.ctx.settings-account.bullet.4':
    '一番下の「アカウント削除」は確認の後ろにあります。最後の管理者は自分を削除できません。',
  // language-region
  'help.guide.language-region.title': '言語、単位、通貨を設定する',
  'help.guide.language-region.goal': 'TREKをあなたの言語で話させ、あなたの流儀で数えさせます。',
  'help.guide.language-region.step.1':
    '「Language & region」でインターフェースの言語を選びます。TREKは即座に切り替わり、サインインしているどの端末にも及びます。',
  'help.guide.language-region.step.2':
    'その下で、時刻形式、すべての日付選択で週を何曜日から始めるか、表示通貨、距離と温度の単位を選びます。',
  'help.guide.language-region.result':
    '日付、距離、金額が期待どおりに読めます。旅行ごとの通貨は、換算後の金額の隣に引き続き表示されます。',
  'help.guide.language-region.tip.1': '表示通貨は旅行をまたいだ合計のためのものです。各旅行は設定した通貨を保ちます。',
  'help.guide.language-region.tip.2': '言語はVacayと日記の曜日名や月名も決めます。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '地図と予約の振る舞いを調整する',
  'help.guide.travel-map-prefs.goal': '旅行の地図が既定で何を表示するかを決めます。',
  'help.guide.travel-map-prefs.step.1':
    '「Travel & map」で、「予約ルートを常に表示」はその日を開いていなくてもフライトや列車を地図に残し、「地図でスポットを探す」は場所を探すピルを表示し、「宿泊先を起点にルートを最適化」は寝る場所からルートを始めます。',
  'help.guide.travel-map-prefs.step.2':
    '「予約コードをぼかす」はマウスを乗せるまで確認番号を隠し、「予約ルートのラベル」は予約名をルートに沿って書き込みます。',
  'help.guide.travel-map-prefs.result': '旅行の地図はどの旅行でもこの設定に従います。切り替え直すまで有効です。',
  'help.guide.travel-map-prefs.tip.1':
    'これはアカウントごとの設定で、旅行ごとではありません。共有旅行のメンバーはそれぞれ自分の選択を見ます。',
  // startup
  'help.guide.startup.title': 'TREKが最初に開く画面を選ぶ',
  'help.guide.startup.goal': '毎回ダッシュボードではなく、いちばんよく作業する場所に着地します。',
  'help.guide.startup.step.1': '「起動」で「起動時の画面」を「ダッシュボード」または「進行中の旅行」に設定します。',
  'help.guide.startup.step.2': '「起動時のタブ」は、旅行を開いたときに最初に表示されるタブを選びます。',
  'help.guide.startup.result': '次のサインインとロゴの次のタップは、まっすぐそこへ向かいます。',
  'help.guide.startup.tip.1': '「進行中の旅行」は今日進行中の旅行、なければ次の旅行を指します。',
  // theme-scheme
  'help.guide.theme-scheme.title': 'テーマとアクセントカラーを設定する',
  'help.guide.theme-scheme.goal': 'TREKをライトかダークか、または端末に合わせて、好きな色にします。',
  'help.guide.theme-scheme.step.1': '「Theme」で「ライト」「ダーク」「自動」を選びます。「自動」は端末に従います。',
  'help.guide.theme-scheme.step.2':
    '「Color scheme」を選びます：「Default」「High contrast」「Indigo」「Teal」「Rose」「Amber」「Violet」「Custom」。',
  'help.guide.theme-scheme.step.3':
    '「Custom」では、プリセットからアクセントを選ぶか、自分の色を入力します。隣のコントラストチェックが、その色の上で文字が読めるかどうかを示します。',
  'help.guide.theme-scheme.result':
    'ボタン、リンク、ハイライトがどこでもそのアクセントになり、サインインしているどの端末にも及びます。',
  'help.guide.theme-scheme.tip.1': 'ナビバーにもライトとダークのクイックスイッチがあります。同じテーマを設定します。',
  'help.guide.theme-scheme.tip.2': '「High contrast」は、既定が淡すぎて読みにくいときに選ぶスキームです。',
  // readability
  'help.guide.readability.title': '読みやすさと文字サイズを調整する',
  'help.guide.readability.goal': 'ガラス効果を減らし、動きを減らし、余白を増やすか文字を大きくします。',
  'help.guide.readability.step.1':
    '「Readability」で、「Transparency」はガラスのパネルを不透明な面に切り替え、「Reduce motion」はアニメーションを最小限にし、「Density」は「Comfortable」か「Compact」を選びます。',
  'help.guide.readability.step.2':
    '「Text size」は「Everything」を一度に拡大縮小します。「Advanced text sizes」ではタイトル、サブタイトル、本文、キャプションを別々にできます。',
  'help.guide.readability.result': '地図のパネルや日記も含めて、アプリ全体が即座に従います。',
  'help.guide.readability.tip.1': '「Reduce motion」は、触らなければシステムの設定にも従います。',
  'help.guide.readability.tip.2':
    '文字サイズはタイポグラフィの階層を通して適用されるので、何も切れません。収まらなくなったサイズは折り返されます。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'ダッシュボードのウィジェットを選ぶ',
  'help.guide.dashboard-widgets.goal': '使うウィジェットだけを、デスクトップとスマートフォンで別々に表示します。',
  'help.guide.dashboard-widgets.step.1':
    '「Dashboard widgets」で、各ウィジェットを「Desktop」と「Mobile」それぞれについてオンまたはオフにします：右サイドバー全体、通貨、Collections、タイムゾーン、今後の予約、Atlasの国、旅の統計。',
  'help.guide.dashboard-widgets.step.2': '下部の「Reset to defaults」で、タブ全体が出荷時の状態に戻ります。',
  'help.guide.dashboard-widgets.result':
    'ダッシュボードは即座に並び直ります。右サイドバーをオフにすると中央寄せになります。',
  'help.guide.dashboard-widgets.tip.1':
    'アドオンのウィジェットは、管理者がそのアドオンをオンにしている間だけ現れます。',
  'help.guide.dashboard-widgets.tip.2':
    'ダッシュボード自体は、グリッド表示かリスト表示か、そして並び順を端末ごとに記憶します。',
  // map-provider
  'help.guide.map-provider.title': '地図エンジンとスタイルを選ぶ',
  'help.guide.map-provider.goal': '従来型の地図、ベクタータイル、Mapboxの3D地図を切り替えます。',
  'help.guide.map-provider.step.1':
    '「地図プロバイダー」で、任意のラスタータイルを使う従来型の2D地図ならLeaflet、トークンなしのOpenFreeMapベクタータイルならMapLibre、3Dの建物と地形を備えたベクタータイルならMapboxを選びます。',
  'help.guide.map-provider.step.2':
    '見た目のために「地図スタイル」または「地図テンプレート」を選びます。Mapboxには「Mapbox アクセストークン」が、一部のラスタースタイルには「CARTO API キー」が必要です。欄の隣のリンクが取得先へ案内します。',
  'help.guide.map-provider.step.3':
    '「高品質モード」はアンチエイリアスと地球儀投影を加えます。「地図を保存」をクリックします。',
  'help.guide.map-provider.result':
    '旅行、Atlas、Collections、日記など、TREKのすべての地図が選んだエンジンで描かれます。',
  'help.guide.map-provider.tip.1':
    'トークンがなければ、Mapboxは何も表示しないのではなく既定の地図にフォールバックします。',
  'help.guide.map-provider.tip.2':
    'オフラインで保存する地図タイルは、ダウンロード時に有効なプロバイダーから取得されます。',
  // notification-channels
  'help.guide.notification-channels.title': '通知の届く先を設定する',
  'help.guide.notification-channels.goal':
    '旅行のリマインダーや共同作業のイベントをスマートフォンやほかのツールで受け取ります。',
  'help.guide.notification-channels.step.1':
    '「通知」で「Ntfy トピック」を入力します。自前で運用しているなら「Ntfy サーバーURL」と「アクセストークン」も加えます。「テスト」ですぐにメッセージが送られます。',
  'help.guide.notification-channels.step.2':
    'または、すべてのイベントをJSONで受け取る「Webhook URL」を指定し、同じように「テスト」します。',
  'help.guide.notification-channels.step.3':
    '下の行で、イベントごとにチャンネル別のオンとオフを切り替えます。プラグインのチャンネルは、プラグインの設定で準備が済むまで「設定する」と表示されます。「テスト送信」で1件試せます。',
  'help.guide.notification-channels.result':
    'イベントはオンになっているチャンネルを通して送られます。ナビバーのベルは、それとは関係なくアプリ内で表示し続けます。',
  'help.guide.notification-channels.tip.1': '旅行ごとの設定は旅行そのものの通知設定にあります。',
  'help.guide.notification-channels.tip.2':
    '管理者は全員向けに既定のntfyサーバーをあらかじめ入れておけます。トピックは引き続き自分で選びます。',
  // photo-providers
  'help.guide.photo-providers.title': '写真ライブラリを接続する',
  'help.guide.photo-providers.goal': '日記がその日の写真をImmichまたはSynology Photosから取り込めるようにします。',
  'help.guide.photo-providers.step.1':
    '「連携」でプロバイダーのセクションを探し、そのURLとAPIキーを入力します。Immichは日記へのアップロードをライブラリに書き戻すことも提案します。',
  'help.guide.photo-providers.step.2': '「接続をテスト」をクリックし、次に「保存」をクリックします。',
  'help.guide.photo-providers.result':
    'エントリーエディターの「External photos」タブが、接続したライブラリからそのエントリーの日の写真を、エントリーの場所に近い順に探します。',
  'help.guide.photo-providers.tip.1':
    '接続はあなた個人のものです。日記のほかのメンバーはそれぞれ自分のライブラリを接続します。',
  'help.guide.photo-providers.tip.2':
    '写真にGPSデータのないプロバイダーでも動作します。その場合、一覧は時刻順になります。',
  // api-keys
  'help.guide.api-keys.title': 'APIキーを作成する',
  'help.guide.api-keys.goal': 'スクリプトやほかのツールがあなたとしてTREK APIを呼び出せるようにします。',
  'help.guide.api-keys.step.1': '「API キー」で「キーを作成」をクリックし、どこで使うかがわかる名前を付けます。',
  'help.guide.api-keys.step.2':
    'ダイアログからキーをコピーします。表示されるのは一度だけです。ツールが不要になったら一覧からキーを削除します。',
  'help.guide.api-keys.result':
    'そのキーによるリクエストはあなたの権限で動作します。一覧には各キーの作成日時と最終使用日時が表示されます。',
  'help.guide.api-keys.tip.1': 'ツールごとに1つのキーにしておくと、取り消しが楽です。',
  'help.guide.api-keys.tip.2':
    'AIアシスタントには代わりにOAuth付きのMCPを使います。APIキーは素のHTTPクライアント向けです。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCP経由でAIアシスタントを接続する',
  'help.guide.mcp-oauth.goal': 'Claude、IDE、そのほかのMCPクライアントに旅行へのアクセスを与えます。',
  'help.guide.mcp-oauth.step.1':
    '「MCP設定」で「MCPエンドポイント」をコピーするか、JSONスニペットを受け付けるクライアントには「クライアント設定」全体をコピーします。',
  'help.guide.mcp-oauth.step.2':
    'ブラウザ経由でログインするクライアントはOAuth 2.1を使います：「OAuth 2.1 クライアント」の「新規クライアント」で、「リダイレクトURI」、「許可スコープ」、そしてブラウザのないサーバー向けには「マシンクライアント」を設定します。',
  'help.guide.mcp-oauth.step.3':
    '「シークレット更新」と「クライアント削除」は各クライアントにあります。「有効なセッション」はサインイン中のものを一覧し、取り消せます。「APIトークン」と「新しいトークン」は以前からの入口です。',
  'help.guide.mcp-oauth.result':
    'クライアントはスコープが許す範囲をあなたとして読み書きでき、すべての操作はあなたの名前で表示されます。',
  'help.guide.mcp-oauth.tip.1': 'スコープは安全網です。必要になるまでは読み取りスコープだけを与えます。',
  'help.guide.mcp-oauth.tip.2': '管理者はインスタンス全体でMCPをオフにできます。その場合、このセクションはありません。',
  // offline-prepare
  'help.guide.offline-prepare.title': '旅行をオフラインに持ち出す',
  'help.guide.offline-prepare.goal': '接続が切れる前に、旅行とその地図をこの端末に用意します。',
  'help.guide.offline-prepare.step.1':
    '「オフラインで保存する内容」で「地図タイルをオフラインで保存」をオンのままにし、この端末に入れたい旅行をオンにします。',
  'help.guide.offline-prepare.step.2':
    '「オフラインの準備」の「オフライン用にダウンロード」をクリックします。旅行と、その場所の周辺のタイルを取得します。',
  'help.guide.offline-prepare.step.3':
    '「オフラインモード」の「オフラインモードを強制」で、出発前にすべてが揃っているか確認できます。',
  'help.guide.offline-prepare.result': '旅行は接続なしで開きます。行った変更はキューで待ち、再接続時に送信されます。',
  'help.guide.offline-prepare.tip.1':
    'いちばん容量を使うのはタイルです。「オフラインキャッシュ」セクションに旅行ごとの保存内容が表示されます。',
  'help.guide.offline-prepare.tip.2':
    'もっとも滑らかにオフラインで起動するには、ブラウザからTREKをアプリとしてインストールします。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '同期の競合でどちらを優先するか決める',
  'help.guide.offline-conflicts.goal': 'オフラインで行った変更とほかの場所での変更を、TREKがどう解決するかを選びます。',
  'help.guide.offline-conflicts.step.1':
    '「同期の競合」で「毎回確認する」「常に自分のバージョンを保持」「常にサーバーのバージョンを保持」のいずれかを選びます。',
  'help.guide.offline-conflicts.step.2':
    '「オフラインキャッシュ」には旅行、保留中と失敗した変更、競合が表示されます。「今すぐ再同期」はキューを送り出し、「キャッシュを消去」は端末を空にします。',
  'help.guide.offline-conflicts.result':
    '「毎回確認する」では、競合時に両方のバージョンが表示され、選べます。ほかの2つでは静かに解決されます。',
  'help.guide.offline-conflicts.tip.1':
    '「キャッシュを消去」はこの端末上のコピーだけを削除します。サーバー上のものには触れません。',
  // profile
  'help.guide.profile.title': 'プロフィールを変更する',
  'help.guide.profile.goal': '名前、メール、写真を更新します。',
  'help.guide.profile.step.1':
    '「アカウント」で「ユーザー名」と「メール」を編集します。アバターには自分の画像をアップロードできます。削除するとイニシャルに戻ります。',
  'help.guide.profile.step.2': '「プロフィールを保存」をクリックします。',
  'help.guide.profile.result': '名前と写真は、共有している旅行も含めてどこでも即座に更新されます。',
  'help.guide.profile.tip.1':
    'OIDC経由でサインインするアカウントはここにその旨が表示され、メールはプロバイダーから取得されます。',
  // password
  'help.guide.password.title': 'パスワードを変更する',
  'help.guide.password.goal': '新しいパスワードを設定します。',
  'help.guide.password.step.1': '「パスワード変更」で現在のパスワードを入力し、次に新しいパスワードを2回入力します。',
  'help.guide.password.step.2': '「パスワード更新」をクリックします。',
  'help.guide.password.result':
    '新しいパスワードは次回のサインインから有効です。ほかのセッションはサインインしたままです。',
  'help.guide.password.tip.1': 'OIDC経由でサインインするアカウントには、変更するTREKのパスワードがありません。',
  // mfa
  'help.guide.mfa.title': '二要素認証をオンにする',
  'help.guide.mfa.goal': '認証アプリのコードでアカウントを守ります。',
  'help.guide.mfa.step.1': '「二要素認証（2FA）」で「認証アプリを設定」をクリックします。',
  'help.guide.mfa.step.2':
    'アプリでQRコードを読み取るか、シークレットを手入力し、表示される6桁のコードを入力して「2FAを有効化」をクリックします。',
  'help.guide.mfa.step.3':
    'バックアップコードを保存します：コピー、ダウンロード、または印刷。スマートフォンが手元にないとき、それぞれ1回だけ使えます。',
  'help.guide.mfa.result': 'サインインのたびに、パスワードの後でコードを求められます。',
  'help.guide.mfa.tip.1': '「2FAを無効化」にはパスワードと現在のコードが必要です。',
  'help.guide.mfa.tip.2': '管理者は全員に2FAを必須にできます。その場合、ここではオフにできません。',
  // passkeys
  'help.guide.passkeys.title': 'パスキーでサインインする',
  'help.guide.passkeys.goal': 'パスワードの代わりに、端末の指紋、顔、またはPINを使います。',
  'help.guide.passkeys.step.1':
    '「パスキー」で「パスキーを追加」をクリックし、端末で確認します。どの端末かがわかる名前を付けます。',
  'help.guide.passkeys.step.2':
    '一覧にはすべてのパスキーが名前と最終使用日時つきで表示されます。削除ボタンで1つ削除できます。',
  'help.guide.passkeys.result': 'サインインページにパスキーが提示されます。パスワードは予備として残ります。',
  'help.guide.passkeys.tip.1':
    'パスキーは端末またはそのパスワードマネージャーに保存されるので、端末ごとに1つ追加します。',
  'help.guide.passkeys.tip.2':
    'パスキーにはHTTPSが必要です。素のHTTPのインスタンスでは、セクションが利用できない理由を説明します。',
  // delete-account
  'help.guide.delete-account.title': 'アカウントを削除する',
  'help.guide.delete-account.goal': 'アカウントと、あなただけのデータを削除します。',
  'help.guide.delete-account.step.1': '「アカウント」の一番下で「アカウント削除」をクリックし、確認します。',
  'help.guide.delete-account.result':
    'アカウント、自分の旅行、日記はなくなります。ほかの人と共有している旅行はその人たちに残ります。',
  'help.guide.delete-account.tip.1':
    'インスタンスの最後の管理者は自分を削除できません。先にほかの誰かを管理者にしてください。',
  'help.guide.delete-account.tip.2':
    '取り消しはできません。残しておきたいものは、確認する前にエクスポートしてください。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理',
  'help.ctx.admin.summary':
    'みんなのTREKを支えるインスタンスの設定です。誰がどのようにサインインできるか、何が有効か、ファイルがどこに置かれるか、サーバーがどう人に連絡するか、どうバックアップされるか。このページは管理者にしか見えず、各タブはサイドバーでそれぞれ独立した画面になっています。',
  'help.ctx.admin.bullet.1':
    '上部の4枚のカードはユーザー、旅行、場所、ファイルの数を示し、その上のバナーが新しいTREKのリリースを知らせます。',
  'help.ctx.admin.bullet.2':
    '「ユーザー」と「ユーザーのデフォルト」：アカウント、招待リンク、そして新しいアカウントが最初に持つ地図設定。',
  'help.ctx.admin.bullet.3':
    '「カスタマイズ」「設定」「アドオン」「プラグイン」：順に、持ち物テンプレート・カテゴリ・学校の休暇、サインイン方法とAPIキー、機能モジュール、サードパーティのプラグインです。',
  'help.ctx.admin.bullet.4':
    '「ストレージ」「通知」「MCPトークン」「GitHub」：順に、アップロードの保存先、インスタンス全体の通知チャンネル、AIクライアントのトークンとセッション、リリース履歴です。',
  'help.ctx.admin.bullet.5':
    '「バックアップ」と「監査」：手動および定期のバックアップと、セキュリティに関わるイベントのログです。',
  'help.ctx.admin-users.title': 'ユーザー',
  'help.ctx.admin-users.summary':
    'このTREKにあるすべてのアカウントを、役割、メールアドレス、最終サインインとともに一覧します。閉じたインスタンスで人が登録できるようにする招待リンクもここにあります。',
  'help.ctx.admin-users.bullet.1':
    'テーブル：ユーザー名、メールアドレス、役割、作成日、最終ログイン、そして行ごとの操作。あなた自身には印が付きます。',
  'help.ctx.admin-users.bullet.2':
    '上部の「ユーザーを作成」で、あなたが渡すパスワード付きのアカウントを手動で追加します。',
  'help.ctx.admin-users.bullet.3':
    '下の「招待リンク」：使用回数の上限と有効期限を持つ一回限りの登録リンクで、必要なら新しいユーザーが到着時に参加する旅行も指定できます。',
  'help.ctx.admin-users.bullet.4':
    '一番下の「権限設定」：操作ごとに、誰が実行できるかを「全員」「旅行メンバー」「旅行オーナー」「管理者のみ」から決めます。',
  'help.ctx.admin-defaults.title': 'ユーザーのデフォルト',
  'help.ctx.admin-defaults.summary':
    '新しいアカウントが最初に持つ設定です。誰も先に地図タブを探さなくて済むように、地図プロバイダー、スタイル、トークン、品質を決めておきます。',
  'help.ctx.admin-defaults.bullet.1':
    '地図プロバイダー、Mapboxのスタイルとトークン、CARTOキー、Mapboxの品質。ユーザーが「設定」の「地図」で設定するのとまったく同じ項目です。',
  'help.ctx.admin-defaults.bullet.2':
    '項目ごとの「リセット」でTREK自身の既定値に戻ります。ユーザー自身の設定は常にこれらより優先されます。',
  'help.ctx.admin-config.title': 'カスタマイズ',
  'help.ctx.admin-config.summary':
    'インスタンス上のすべての旅行が共有するもの：持ち物テンプレート、場所とコレクションに使うカテゴリのセット、そしてVacayが参照する学校の休暇カタログです。',
  'help.ctx.admin-config.bullet.1':
    '「持ち物テンプレート」：旅行の持ち物リストの出発点になる、カテゴリと項目の名前付きリスト。',
  'help.ctx.admin-config.bullet.2':
    '「カテゴリ」：場所インスペクターからコレクションまで、TREK全体で使われるカテゴリの名前、アイコン、色。',
  'help.ctx.admin-config.bullet.3':
    '「学校の休暇」：組み込みのフィードがカバーしない場所のための、国と地域のカタログ。',
  'help.ctx.admin-settings.title': '設定',
  'help.ctx.admin-settings.summary':
    '人がどうやって入るか、サーバーが何と通信してよいか：サインインと登録の方法、SSO、パスキー、二要素認証のポリシー、地図・場所・画像のAPIキー、検索と公共交通のプロバイダー、そしてアップロードに許可するファイル形式。',
  'help.ctx.admin-settings.bullet.1':
    '「認証方法」：「パスワードログイン」「パスワード登録」「SSOログイン」「SSO自動登録」「二要素認証（2FA）を必須にする」。',
  'help.ctx.admin-settings.bullet.2':
    '「シングルサインオン（OIDC）」にはIssuer、クライアント、表示名を。「パスキーログイン」にはRelying Party IDとオリジンを。',
  'help.ctx.admin-settings.bullet.3':
    '「APIキー」：Google Maps、Unsplash、Amapのそれぞれに「テスト」付き。「キーの使いみち」で、Googleキーを支払ってもよい機能だけに絞れます。',
  'help.ctx.admin-settings.bullet.4':
    '「地点検索のプロバイダー」と「公共交通のプロバイダー」で、誰が検索と経路に答えるかを選びます。「許可するファイル形式」はアップロードを制限します。',
  'help.ctx.admin-addons.title': 'アドオン',
  'help.ctx.admin-addons.summary':
    'TREKの機能モジュールで、それぞれにスイッチがあります：リスト、費用、ドキュメント、Vacay、Atlas、Collab、日記、コレクション、ロードトリップ、MCP、AirTrail、Dawarich、そしてAI解析。オフにすると、ナビゲーションの項目、ルート、APIが全員から消えます。',
  'help.ctx.admin-addons.bullet.1': 'アドオンごとに1枚のタイルとスイッチ、オプションがあればそのサブ行。',
  'help.ctx.admin-addons.bullet.2':
    '写真プロバイダーとドキュメントプロバイダーもここにタイルとして並び、ImmichやSynologyをユーザーに提供できます。',
  'help.ctx.admin-addons.bullet.3': '「バッグ管理」はタイルの下に独自のスイッチがあります。',
  'help.ctx.admin-plugins.title': 'プラグイン',
  'help.ctx.admin-plugins.summary':
    'TREKの隣で独自のプロセスとして動くサードパーティのプラグインで、それぞれインストール時に求めた権限を持ちます。カタログからインストールするか、パッケージをアップロードするか、開発中はフォルダをリンクします。',
  'help.ctx.admin-plugins.bullet.1':
    '一覧：インストール済みのプラグインすべてを、バージョン、状態、署名、保持している権限とともに表示。行ごとに有効化、無効化、更新、アンインストールができます。',
  'help.ctx.admin-plugins.bullet.2':
    '「プラグインをアップロード」はパッケージファイルを受け取り、「再スキャン」は開発用にリンクしたプラグインフォルダを取り込みます。',
  'help.ctx.admin-plugins.bullet.3':
    'プラグインごとの「許可するホスト」：プラグインが呼び出してよいアドレス。外部通信は既定で拒否されます。',
  'help.ctx.admin-storage.title': 'ストレージ',
  'help.ctx.admin-storage.summary':
    'アップロードの保存先：ローカルディスク、S3バケット、または両方に書き込むミラー。アップロードのカテゴリごとに別のバックエンドを選べ、「ヘルス」がすべてのバックエンドが応答するかを示します。',
  'help.ctx.admin-storage.bullet.1':
    '「バックエンド」：それぞれの名前と種類に「テスト」「編集」「削除」。環境変数で設定されたものはここでは読み取り専用です。',
  'help.ctx.admin-storage.bullet.2':
    '「カテゴリ」：カバー、ドキュメント、日記の写真、その他をそれぞれバックエンドに割り当てます。変更すると既存ファイルの移動を提案します。',
  'help.ctx.admin-storage.bullet.3':
    '「ヘルス」：バックエンドごとのチェックと、設定がサーバーの見ているものと同じであることを証明するシードファイル。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    'インスタンスがユーザーに提供するチャンネルと、管理者であるあなたに届くチャンネル。ユーザーは「設定」で自分のトピックやURLを選び、あなたは何を用意するかを決めてメールを設定します。',
  'help.ctx.admin-notifications.bullet.1':
    '「アプリ内」「メール（SMTP）」「Ntfy」「Webhook」「Webプッシュ」：それぞれ1つのパネルに、チャンネルをユーザーに提供するスイッチと、必要なサーバー側の設定があります。',
  'help.ctx.admin-notifications.bullet.2':
    '「旅行リマインダー」：旅行が始まる前にサーバーがリマインダーを送るかどうか。',
  'help.ctx.admin-notifications.bullet.3':
    '「管理者Ntfy」と「管理者Webhook」：失敗したバックアップや新しいリリースといった管理者イベントの送り先で、「テスト」付き。',
  'help.ctx.admin-mcp-tokens.title': 'MCPトークン',
  'help.ctx.admin-mcp-tokens.summary':
    'AIクライアントがこのTREKに対して持つすべてのトークンとOAuthセッションを、全ユーザーにわたって一覧し、どれでも取り消せます。',
  'help.ctx.admin-mcp-tokens.bullet.1': '「API トークン」：誰が作成し、いつ最後に使われたか、そして「削除」。',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '「OAuthセッション」：クライアント、ユーザー、付与されたスコープ、そして「無効化」。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREKの新着情報：GitHubのリリース履歴、稼働中のバージョン、そして新しいバージョンが出ているかどうか。更新そのものはアプリの外、ホスト上で行います。',
  'help.ctx.admin-github.bullet.1':
    '「リリース履歴」はリリースをノート付きで一覧します。最新のものには「最新」が付き、あなたのバージョンには印が付きます。',
  'help.ctx.admin-github.bullet.2':
    '新しいリリースが出るとヘッダーに「更新があります」が現れ、Dockerとその他のインストール向けの更新方法が示されます。',
  'help.ctx.admin-backup.title': 'バックアップ',
  'help.ctx.admin-backup.summary':
    'データベースとアップロードの完全バックアップ。手動または定期で作成し、サーバーに保存され、1つのファイルとしてダウンロードできます。「復元」で元に戻します。',
  'help.ctx.admin-backup.bullet.1':
    '「データバックアップ」：「バックアップを作成」と、既存のバックアップの一覧に「ダウンロード」「復元」「削除」。',
  'help.ctx.admin-backup.bullet.2':
    '「バックアップをアップロード」は、別のインスタンスや以前の日に作ったファイルを持ち込みます。',
  'help.ctx.admin-backup.bullet.3': '「自動バックアップ」：オンかオフか、間隔、時刻と曜日、保持する数。',
  'help.ctx.admin-audit.title': '監査',
  'help.ctx.admin-audit.summary':
    'セキュリティと管理に関わるイベントのログ：サインインと失敗、MFAの変更、ユーザーと設定の変更、バックアップと復元。読み取り専用で、新しいものが先です。',
  'help.ctx.admin-audit.bullet.1': 'イベントごとに1行で、時刻、ユーザー、操作、リソース、IP、詳細。',
  'help.ctx.admin-audit.bullet.2': '「更新」で再読み込み、「さらに読み込む」でさらに過去へ。',
  // create-user
  'help.guide.create-user.title': 'ユーザーを作成する',
  'help.guide.create-user.goal': '招待なしで、アカウントを手動で追加します。',
  'help.guide.create-user.step.1': '「ユーザー」タブ上部の「ユーザーを作成」をクリックします。',
  'help.guide.create-user.step.2':
    '「ユーザー名」「メールアドレス」「パスワード」を入力し、「役割」を「ユーザー」か「管理者」から選びます。',
  'help.guide.create-user.step.3': '「ユーザーを作成」をクリックします。',
  'help.guide.create-user.result':
    'アカウントがテーブルに現れ、すぐにサインインできます。パスワードは信頼できる経路で渡してください。',
  'help.guide.create-user.tip.1': '自分でパスワードを決めてもらいたい人には、招待リンクのほうが適しています。',
  'help.guide.create-user.tip.2': '管理者はこのページと監査ログを見られます。それ以外は両方の役割で同じです。',
  // edit-user
  'help.guide.edit-user.title': 'ユーザーの役割やパスワードを変更する',
  'help.guide.edit-user.goal': '誰かを昇格または降格させる、あるいはパスワードを忘れた人を復帰させます。',
  'help.guide.edit-user.step.1':
    'ユーザーの行の鉛筆をクリックします。アカウントの詳細とともに「ユーザーを編集」が開きます。',
  'help.guide.edit-user.step.2':
    '「役割」を変更するか、「新しいパスワード」を設定するか、パスキーを保存していた端末を失った人なら「パスキーをリセット」をクリックし、「保存」します。',
  'help.guide.edit-user.result': '変更は次のリクエストから適用されます。新しいパスワードは次のサインインから使えます。',
  'help.guide.edit-user.tip.1': '自分が最後の管理者である間は、自分から管理者の役割を外せません。',
  'help.guide.edit-user.tip.2':
    'パスキーをリセットしてもパスワードは残ります。本人が「設定」の「アカウント」で新しいパスキーを追加します。',
  // invite-links
  'help.guide.invite-links.title': 'リンクで誰かを招待する',
  'help.guide.invite-links.goal': '閉じたインスタンスに人が登録できるようにし、必要なら旅行に直接参加させます。',
  'help.guide.invite-links.step.1': '「招待リンク」の下で「リンク作成」をクリックします。',
  'help.guide.invite-links.step.2':
    '「最大使用回数」と「有効期限」を設定し、必要に応じて「旅行に追加（任意）」を選び、「作成してコピー」をクリックします。',
  'help.guide.invite-links.step.3':
    'リンクを送ります。各行には使用回数と作成者が表示されます。「リンクをコピー」で再びコピーでき、使い切ったリンクや期限切れのリンクには印が付きます。',
  'help.guide.invite-links.result':
    'リンクを開いた人は自分のパスワードで登録し、旅行が選ばれていればすぐにそれに参加します。',
  'help.guide.invite-links.tip.1': '招待リンクは、「設定」で「パスワード登録」がオフの間も機能します。',
  'help.guide.invite-links.tip.2': '1人向けには、使用回数1回で有効期限の短いリンクがもっとも安全な既定です。',
  // delete-user
  'help.guide.delete-user.title': 'ユーザーを削除する',
  'help.guide.delete-user.goal': 'アカウントと、そのアカウントだけが所有するものをすべて削除します。',
  'help.guide.delete-user.step.1': 'ユーザーの行のゴミ箱アイコンをクリックし、「ユーザー削除」で確認します。',
  'help.guide.delete-user.result':
    'アカウント、そのユーザー自身の旅行、日記は消えます。他の人と共有していた旅行は残りのメンバーに残ります。',
  'help.guide.delete-user.tip.1': '元に戻す手段はありません。確信がなければ先にバックアップを取ってください。',
  'help.guide.delete-user.tip.2': '最後の管理者は削除できません。先に誰か別の人を管理者にしてください。',
  // permissions
  'help.guide.permissions.title': '誰が何をできるかを決める',
  'help.guide.permissions.goal': '操作ごとに、このTREKでどの役割に許可するかを設定します。',
  'help.guide.permissions.step.1':
    '「権限設定」で、操作をそのグループの中から探します。たとえば「旅行管理」の下の「旅行を削除」です。レベルを「全員」「旅行メンバー」「旅行オーナー」「管理者のみ」から選びます。変更した行には「カスタマイズ済み」と表示されます。',
  'help.guide.permissions.step.2':
    '「保存」をクリックします。「既定に戻す」は、すべての行を組み込みのレベルに戻します。',
  'help.guide.permissions.result':
    'ルールはすべての旅行に一度に適用されます。レベルに満たない人のボタンやメニューは表示されなくなります。',
  'help.guide.permissions.tip.1':
    '「旅行オーナー」とは旅行を作成した人のことです。管理者は常にすべての操作ができます。',
  'help.guide.permissions.tip.2':
    'メンバーを削除するより、レベルを下げましょう。編集できないメンバーでも、閲覧とコメントはできます。',
  // default-map
  'help.guide.default-map.title': '新規ユーザーの地図の既定値を設定する',
  'help.guide.default-map.goal': '個人のトークンなしでも、新しいアカウントすべてに動く地図を用意します。',
  'help.guide.default-map.step.1':
    '「地図」の下で「地図エンジン」を選び、MapboxまたはMapLibreなら「地図スタイル」「共有 Mapbox トークン」「高品質モード」を、ラスター地図なら「地図テンプレート」と「共有 CARTO キー」を設定します。',
  'help.guide.default-map.step.2':
    '変更した項目の横の「リセット」でTREK自身の既定値に戻ります。左の「既定のユーザー設定」は「カラーモード」、単位、通貨について同じことをします。',
  'help.guide.default-map.result':
    '新しいアカウントはこの設定で始まります。「設定」で自分の地図を設定した人は自分のものを保ちます。',
  'help.guide.default-map.tip.1':
    'ここで入力したトークンは、自分のトークンを持たない全員で共有されるので、割り当て量に注意してください。',
  'help.guide.default-map.tip.2': '地図タブに一度も触れていない既存のアカウントも、この既定値に従います。',
  // packing-templates
  'help.guide.packing-templates.title': '持ち物テンプレートを作る',
  'help.guide.packing-templates.goal': '空のリストではなく、出発点となる持ち物リストを旅行に与えます。',
  'help.guide.packing-templates.step.1': '「新規テンプレート」をクリックし、名前を入力してチェックマークで確定します。',
  'help.guide.packing-templates.step.2':
    'テンプレートを開いて「カテゴリを追加」をクリックします。各カテゴリの下の「+」で項目を追加でき、項目には名前だけあれば十分です。',
  'help.guide.packing-templates.step.3':
    'すべてその場で保存されます。鉛筆でテンプレート、カテゴリ、項目の名前を変更し、ゴミ箱で削除します。',
  'help.guide.packing-templates.result':
    'テンプレートはすべての旅行の持ち物リストで提案されます。適用すると項目がコピーされるので、旅行ごとに自由に変更できます。',
  'help.guide.packing-templates.tip.1':
    'ビーチ、都市、ハイキングなど旅行の種類ごとのテンプレートのほうが、1つの巨大なリストより使いやすいです。',
  'help.guide.packing-templates.tip.2': 'テンプレートを削除しても、すでに適用した旅行には影響しません。',
  // categories
  'help.guide.categories.title': 'カテゴリのセットを管理する',
  'help.guide.categories.goal': '場所とコレクションが持てるカテゴリと、その見た目を決めます。',
  'help.guide.categories.step.1':
    '「新しいカテゴリ」をクリックし、名前を付け、アイコンと色を選びます。「プレビュー」に結果が表示されます。「作成」をクリックします。',
  'help.guide.categories.step.2':
    '一覧のカテゴリにマウスを乗せると編集や削除ができます。削除時には確認を求められます。',
  'help.guide.categories.result':
    'セットはどこでも一度に適用されます：場所インスペクター、地図のピン、コレクション、フィルター。',
  'help.guide.categories.tip.1':
    '場所はカテゴリのIDを保持するので、カテゴリの名前を変えるとすべての場所で名前が変わります。',
  'help.guide.categories.tip.2':
    '削除したカテゴリの場所はカテゴリなしになります。それが問題なら先に割り当て直してください。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '学校の休暇を手動で管理する',
  'help.guide.school-holiday-catalog.goal': '組み込みの休暇フィードがカバーしない国や地域を補います。',
  'help.guide.school-holiday-catalog.step.1':
    '「学校の休暇」の下で「国を追加」をクリックし、「国」と「国コード（例：US）」を入力して「保存」します。次に、異なる部分ごとに「地域を追加」します。',
  'help.guide.school-holiday-catalog.step.2':
    '地域をクリックして「地域または学区」を開きます。「休暇期間を追加」で、それぞれに「休暇名」「開始日」「終了日」を付けて「保存」します。ゴミ箱で期間、地域、そして地域がなくなった国を削除します。',
  'help.guide.school-holiday-catalog.result':
    'ユーザーはVacayの「設定」でその国と地域を見つけ、年間グリッドに期間が表示されます。',
  'help.guide.school-holiday-catalog.tip.1':
    '組み込みフィードの地域はここでは編集できません。日付が間違っていれば、手動の地域を並べて追加してください。',
  // auth-methods
  'help.guide.auth-methods.title': 'サインイン方法を決める',
  'help.guide.auth-methods.goal': 'パスワードによるサインイン、SSO、登録を開閉し、2FAを必須にします。',
  'help.guide.auth-methods.step.1':
    '「認証方法」の下で「パスワードログイン」と「パスワード登録」をオンまたはオフにします。登録がオフだと、新しいアカウントは招待リンク、SSO、手動作成でしか作れません。',
  'help.guide.auth-methods.step.2':
    '「SSOログイン」と「SSO自動登録」には、下で「シングルサインオン（OIDC）」の設定が必要です。自動登録は、誰かが初めてSSOでサインインしたときにアカウントを作ります。',
  'help.guide.auth-methods.step.3':
    '「二要素認証（2FA）を必須にする」は、パスワードでサインインする全員に次回ログイン時の認証アプリの設定を求めます。「パスキーログイン」には、Relying Party IDと、あなたのTREKにアクセスされるオリジンが必要です。',
  'help.guide.auth-methods.result': 'サインインページには、オンのままにした方法だけが表示されます。',
  'help.guide.auth-methods.tip.1':
    '自分を締め出す前に警告が出ます。管理者のための入口が少なくとも1つはオンのままになります。',
  'help.guide.auth-methods.tip.2': '環境変数で設定された値は、ここでは読み取り専用として表示されます。',
  // oidc
  'help.guide.oidc.title': 'シングルサインオンを接続する',
  'help.guide.oidc.goal': 'あなたのIDプロバイダーでサインインできるようにします。',
  'help.guide.oidc.step.1':
    '「シングルサインオン（OIDC）」の下で、ボタン用の「表示名」と、プロバイダーから取得した「Issuer URL」「Client ID」「Client Secret」を入力し、「保存」します。',
  'help.guide.oidc.step.2': '「認証方法」の下で「SSOログイン」をオンにします。',
  'help.guide.oidc.result':
    'サインインページにSSOボタンが表示されます。「SSO自動登録」がオンなら、初めてのユーザーには自動でアカウントが作られます。',
  'help.guide.oidc.tip.1':
    'プロバイダーに必要なリダイレクトURIは、あなたのTREKのアドレスに、ドキュメントにあるOIDCコールバックのパスを加えたものです。',
  'help.guide.oidc.tip.2':
    'どのSSOグループが管理者になるかはクレームマッピングで決まります。ドキュメントのOIDCのページを参照してください。',
  // instance-keys
  'help.guide.instance-keys.title': 'APIキーを入力する',
  'help.guide.instance-keys.goal': 'インスタンス全体で、Googleの地点検索、Unsplashのカバー、Amapを使えるようにします。',
  'help.guide.instance-keys.step.1':
    '「APIキー」の下で「Google Maps APIキー」を貼り付け、「テスト」をクリックします。キーが応答するかどうかがフィールドに表示されます。',
  'help.guide.instance-keys.step.2':
    '「キーの使いみち」の下で、そのキーに課金してよい機能だけをオンにします：オートコンプリート、詳細、写真、情報補完、場所検索の記録。',
  'help.guide.instance-keys.step.3':
    '「Unsplash APIキー」はカバー検索を、「Amap（高德地图）API キー」は中国での地点検索を担います。それぞれ同じ方法でテストします。',
  'help.guide.instance-keys.result':
    'ユーザーは自分のキーなしで機能を使えます。Googleキーがなければ、TREKは無料のOpenStreetMapスタックとTREK Places APIで検索します。',
  'help.guide.instance-keys.tip.1':
    'ユーザーが「設定」で入れた個人のキーは、そのユーザーにとってはインスタンスのキーより優先されます。',
  'help.guide.instance-keys.tip.2':
    'キーは環境変数からも設定できます。その場合、ここでは読み取り専用として表示されます。',
  // places-transit
  'help.guide.places-transit.title': '検索と公共交通のプロバイダーを選ぶ',
  'help.guide.places-transit.goal': '地点検索と公共交通の経路に誰が答えるかを決めます。',
  'help.guide.places-transit.step.1':
    '「地点検索のプロバイダー」の下で「自動」「Google Places」「Amap（高德地图）」「OpenStreetMap」から選びます。「自動」は存在するもっとも良いキーを使います。',
  'help.guide.places-transit.step.2':
    '「公共交通のプロバイダー」の下で、世界中で使えてキー不要の「Transitous（無料）」か、Googleキーが必要な「Google」を選びます。',
  'help.guide.places-transit.result': 'TREKのすべての検索ボックスとすべての公共交通の経路がこの選択に従います。',
  'help.guide.places-transit.tip.1':
    'キーのないプロバイダーはここに警告を表示し、OpenStreetMapにフォールバックします。',
  'help.guide.places-transit.tip.2':
    'Googleの公共交通の経路はリクエストごとに課金されます。Transitousは課金されません。',
  // file-types
  'help.guide.file-types.title': 'ファイル形式を制限する',
  'help.guide.file-types.goal': 'アップロードに許可する拡張子を決めます。',
  'help.guide.file-types.step.1': '「許可するファイル形式」の下で、カンマ区切りの拡張子の一覧を編集して保存します。',
  'help.guide.file-types.result':
    'それ以外の形式のアップロードは、ドキュメント、日記、カバーのいずれでも、明確なメッセージとともに拒否されます。',
  'help.guide.file-types.tip.1': '画像形式は一覧に残してください。カバーと日記の写真も同じチェックを通ります。',
  // toggle-addon
  'help.guide.toggle-addon.title': 'アドオンをオンまたはオフにする',
  'help.guide.toggle-addon.goal': '機能モジュールを全員に提供するか、取り下げます。',
  'help.guide.toggle-addon.step.1':
    'アドオンのタイルのスイッチを切り替えます。ナビゲーションの項目が全員に対して一斉に現れたり消えたりします。',
  'help.guide.toggle-addon.step.2':
    '一部のタイルにはオプションのサブ行があります。たとえば「リスト」の下の「バッグ管理」や、「日記」の下の写真プロバイダーです。これらはアドオンがオンの間だけ表示されます。',
  'help.guide.toggle-addon.result': 'オフにしたアドオンのデータは保持されます。再びオンにすれば再び表示されます。',
  'help.guide.toggle-addon.tip.1':
    'MCPをオフにすると、エンドポイントと、それに依存する「連携」のセクションが消えます。',
  'help.guide.toggle-addon.tip.2':
    'Vacay、Atlas、日記はユーザーの要望がもっとも多いアドオンです。ドキュメントにはアップロード用のストレージが必要です。',
  // install-plugin
  'help.guide.install-plugin.title': 'プラグインをインストールする',
  'help.guide.install-plugin.goal': 'サードパーティのプラグインを追加し、求められた権限だけを与えます。',
  'help.guide.install-plugin.step.1':
    '「探す」を開いてプラグインを選び「インストール」をクリックするか、「プラグインをアップロード」をクリックして.zipまたは.tar.gzのパッケージを選びます。',
  'help.guide.install-plugin.step.2':
    '「インストール済み」に戻って行を読みます：プラグインが読み書きできるもの、呼び出すホスト、署名の有無。「プラグインを有効にする」をオンにします。',
  'help.guide.install-plugin.step.3':
    '行のメニューには「再起動」「エラーログを表示」「許可するホスト」「バージョン変更…」があり、「削除」でアンインストールします。新しいバージョンがあれば行に更新が提案され、新しい権限を求める更新はあなたが承認するまでオフのままです。',
  'help.guide.install-plugin.result':
    'プラグインは独自のプロセスで動きます。追加されるウィジェット、地図レイヤー、ツールは、プラグインが宣言した場所に現れます。',
  'help.guide.install-plugin.tip.1':
    '「再スキャン」は、パッケージなしで開発用にリンクしたプラグインフォルダを取り込みます。',
  'help.guide.install-plugin.tip.2':
    '署名のないプラグインにはその印が付きます。ソースを信頼できる場合にだけインストールしてください。',
  // storage-backends
  'help.guide.storage-backends.title': 'アップロードをS3やミラーへ移す',
  'help.guide.storage-backends.goal':
    'ファイルをオブジェクトストレージに、あるいはディスクとバケットの両方に保存します。',
  'help.guide.storage-backends.step.1':
    '「バックエンド」の下で「バックエンドを追加」をクリックし、「名前」を付け、「タイプ」を「ローカル」「S3」「ミラー」から選び、フィールドを埋めて「適用」します。「テスト」で接続を確認し、「変更を保存」で書き込みます。',
  'help.guide.storage-backends.step.2':
    '「カテゴリ」の下で、アップロードのカテゴリごとにバックエンドを割り当てます。変更すると「既存のオブジェクトを移動」か「新規書き込みのみ切り替える」かを尋ねられます。',
  'help.guide.storage-backends.step.3':
    '上部の「ヘルス」がすべてのバックエンドをチェックします。赤い項目は何が失敗したかを示します。',
  'help.guide.storage-backends.result':
    '新しいアップロードは割り当てたバックエンドに入ります。移動したファイルはそこから配信されます。',
  'help.guide.storage-backends.tip.1': '環境変数で設定されたバックエンドは表示されますが、ここでは編集できません。',
  'help.guide.storage-backends.tip.2':
    'ミラーは両方の宛先に書き込み、最初の宛先から読み取ります。ダウンタイムなしの移行に使ってください。',
  // channels-instance
  'help.guide.channels-instance.title': '通知チャンネルを設定する',
  'help.guide.channels-instance.goal': 'ユーザーが選べるチャンネルを決め、メールを設定します。',
  'help.guide.channels-instance.step.1':
    '「メール（SMTP）」の下で、SMTP Host、SMTP Port、SMTP User、SMTP Password、From Addressを入力します。「テストメール送信」であなた宛てにメールが送られます。',
  'help.guide.channels-instance.step.2':
    '「Webプッシュ」「Ntfy」「Webhook」をオンにして提供します。ユーザーは「設定」の「通知」で、デバイスごとにプッシュをオンにするか、自分のトピックやURLを入力します。',
  'help.guide.channels-instance.step.3':
    '「旅行リマインダー」は旅行が始まる前のリマインダーを切り替えます。「アプリ内」は常にオンで、ここでは説明されるだけです。',
  'help.guide.channels-instance.result':
    'すべてのユーザーの「通知」タブに、あなたがオンにしたチャンネルが表示されます。',
  'help.guide.channels-instance.tip.1':
    'ここで入力した既定のntfyサーバーはユーザーに事前入力されます。ユーザーは自分のサーバーを指定することもできます。',
  'help.guide.channels-instance.tip.2':
    'プラグインのチャンネルは、その機能を持つプラグインが有効になると自動的に現れます。',
  // admin-channels
  'help.guide.admin-channels.title': '管理者イベントをスマホで受け取る',
  'help.guide.admin-channels.goal':
    '失敗したバックアップ、新しいリリース、その他のインスタンスのイベントを知らせてもらいます。',
  'help.guide.admin-channels.step.1':
    '「管理者Ntfy」の下でトピックと、必要ならサーバーとトークンを入力します。「管理者Webhook」の下にはURLを入力します。',
  'help.guide.admin-channels.step.2':
    '「ntfyテスト送信」または「Webhookテスト送信」をクリックして、メッセージが届くのを確認します。',
  'help.guide.admin-channels.result': '管理者イベントは、各管理者のアプリ内のベルに加えてそこにも届きます。',
  'help.guide.admin-channels.tip.1':
    '管理者用のトピックは個人用と分けてください。障害の通知が旅行の通知に埋もれないようにするためです。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AIのアクセスを取り消す',
  'help.guide.mcp-tokens-admin.goal':
    'どのユーザーのものでも、AIクライアントが持つトークンとセッションをすべて見て切断します。',
  'help.guide.mcp-tokens-admin.step.1':
    '「API トークン」の下でユーザーと名前からトークンを探します。ゴミ箱で削除すると、クライアントはすぐに止まります。',
  'help.guide.mcp-tokens-admin.step.2':
    '「OAuthセッション」の下ではブラウザーベースのクライアントについて同じことができます：クライアント、ユーザー、日付があり、ゴミ箱でセッションを無効化します。',
  'help.guide.mcp-tokens-admin.result':
    'クライアントはユーザーが再び接続する必要があります。それ以外は何も変わりません。',
  'help.guide.mcp-tokens-admin.tip.1':
    'スコープを見ればクライアントに何ができたかがわかります。読み取り専用のスコープは残しておいても無害です。',
  'help.guide.mcp-tokens-admin.tip.2': 'MCPアドオンをオフにすると、すべてが一度に取り消されます。',
  // release-history
  'help.guide.release-history.title': '新しいリリースを確認する',
  'help.guide.release-history.goal': 'あなたのTREKが最新かどうか、次のバージョンで何が来るかを知ります。',
  'help.guide.release-history.step.1':
    '新しいリリースがあると、管理ページの上部に「更新があります」が表示されます。「GitHubで見る」で開き、「更新方法」がDockerとその他のインストールでの更新を説明します。',
  'help.guide.release-history.step.2':
    '「リリース履歴」はすべてのリリースをノート付きで一覧します。「詳細を表示」で展開し、最新のものには「最新」が付き、「さらに読み込む」でさらに過去へ進みます。',
  'help.guide.release-history.result':
    '更新はホスト上で、新しいイメージを取得するか新しいタグをビルドして行います。データディレクトリはそのまま残ります。',
  'help.guide.release-history.tip.1': '更新の前にバックアップを取ってください。「バックアップ」タブはすぐ隣です。',
  'help.guide.release-history.tip.2':
    'プレリリースは表示されますが、あなたがプレリリースを使っていない限り更新として知らされません。',
  // create-backup
  'help.guide.create-backup.title': 'バックアップを作成して復元する',
  'help.guide.create-backup.goal':
    'インスタンス全体のスナップショットを取り、別の場所にコピーを保管し、元に戻せるようにします。',
  'help.guide.create-backup.step.1':
    '「データバックアップ」の下で「バックアップを作成」をクリックします。データベースとアップロードがサーバー上の1つのファイルにまとめられます。',
  'help.guide.create-backup.step.2':
    '「ダウンロード」でマシンの外にコピーを保管します。ゴミ箱で古いものを削除して容量を空けます。',
  'help.guide.create-backup.step.3':
    'バックアップの「復元」、またはファイルを使った「バックアップをアップロード」は、「バックアップを復元しますか？」が一度確認したあと、現在のデータを置き換えます。',
  'help.guide.create-backup.result':
    '復元するとユーザー、旅行、ファイル、設定がそのバックアップ時点の状態に戻り、全員がサインアウトされます。',
  'help.guide.create-backup.tip.1': '復元はここで唯一、元に戻せない操作です。先に新しいバックアップを作ってください。',
  'help.guide.create-backup.tip.2':
    'バックアップはデータディレクトリにあります。別のマシンにコピーがあってこそ、バックアップと呼べます。',
  // auto-backup
  'help.guide.auto-backup.title': 'バックアップをスケジュールする',
  'help.guide.auto-backup.goal': 'サーバーに自動でバックアップさせ、直近の数個だけを残します。',
  'help.guide.auto-backup.step.1':
    '「自動バックアップ」の下で「自動バックアップを有効化」をオンにし、「間隔」「実行時刻」と、週次または月次なら「曜日」または「月の日」を選びます。',
  'help.guide.auto-backup.step.2':
    '「古いバックアップを削除」でバックアップを保持する期間を設定します。新しいものが作られると、それより古いものは消えます。',
  'help.guide.auto-backup.result':
    'バックアップはスケジュールどおりに一覧に現れます。失敗は管理者チャンネルに届きます。',
  'help.guide.auto-backup.tip.1':
    '時刻はサーバーのタイムゾーンに従います。タイムゾーンは「監査」タブに表示されています。',
  'help.guide.auto-backup.tip.2': 'サーバーの容量には限りがあります。3〜5個を保持すれば通常は十分です。',
  // audit-log
  'help.guide.audit-log.title': '監査ログを読む',
  'help.guide.audit-log.goal': '誰が何を、いつしたかを調べます。',
  'help.guide.audit-log.step.1':
    '行を読みます：時刻、ユーザー、操作、リソース、IP、詳細。新しいものが先です。操作は、ログインの失敗、MFAの変更、復元など、起きたことで名付けられています。',
  'help.guide.audit-log.step.2': '「更新」で先頭を再読み込みし、「さらに読み込む」でさらに過去へ進みます。',
  'help.guide.audit-log.result': 'なぜ何かが変わったのかを尋ねる人に渡せる記録です。',
  'help.guide.audit-log.tip.1': '時刻はサーバーのタイムゾーンで表示され、テーブルの上にその名前があります。',
  'help.guide.audit-log.tip.2': 'ログは追記専用です。ここにあるものはアプリからは編集も削除もできません。',
  // document-providers
  'help.guide.document-providers.title': 'ドキュメントの保管先を提供する',
  'help.guide.document-providers.goal': '旅行がどの保管先とドキュメントを同期してよいかを決めます。',
  'help.guide.document-providers.step.1':
    '「ドキュメント」タイルは、その棚に保管先を行として持ちます。Paperless-ngx、Papra、Nextcloud、OpenCloud、Synology Drive です。5つとも最初はオフで、棚は「ドキュメント」自体がオンの間だけあります。',
  'help.guide.document-providers.step.2':
    'Nextcloud の行のスイッチを切り替えます。メッセージは「アドオンを更新しました」と読め、以後、旅行のオーナーは自分の旅行の「ファイル」タブに「ドキュメント同期」を見つけ、「連携先を接続」の下に Nextcloud があります。',
  'help.guide.document-providers.result':
    'その保管先はこの TREK のすべての旅行で提供されます。旅行のオーナーが接続するまで、何も接続されません。',
  'help.guide.document-providers.tip.1':
    'ここで決めるのは保管先を提供してよいかどうかだけです。アドレスと認証情報は旅行のもので、その「ファイル」タブで旅行のオーナーが入力します。管理パネルで入力することはありません。',
  'help.guide.document-providers.tip.2':
    '「ドキュメント」をオフにすると、すべての保管先も一緒にオフになり、「ドキュメント」がオフの間は保管先をオンにできません。サーバーは「Enable the Documents addon first」と答えます。自分のネットワーク上の保管先には、サーバーに ALLOW_INTERNAL_NETWORK=true も必要です。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '1つの旅行のすべてがここにあります。日程、地図、場所を含む計画と、移動、予約、リスト、費用、ファイル、コラボレーションのタブです。それぞれに、この画面の下に専用のヘルプ画面があります。',
  'help.ctx.trip.bullet.1':
    'タブバー：「計画」「移動」「予約」「リスト」「費用」「ファイル」「Collab」。どのタブがあるかは、あなたのTREKのアドオンとプラグインで決まります。',
  'help.ctx.trip.bullet.2':
    '「計画」は3つの列です。左に日程、中央に地図、右に場所。予約と移動は計画の中に、つまり立ち寄り先とその間にあり、タブはそれらを一覧にします。',
  'help.ctx.trip.bullet.3':
    '右上の「共有」は旅行の人たちを開きます。メンバー、ゲスト、招待リンク、そして読み取り専用の公開リンクです。',
  'help.ctx.trip.bullet.4': 'タイトル、日付、カバー、通貨は「マイ旅行」から、旅行カードの鉛筆で編集します。',
  'help.ctx.trip.bullet.5':
    '列の内側の端にあるシェブロンは列を折りたたみ、地図がその場所を使います。列の隣の細い仕切りは列の幅を変えます。',
  'help.ctx.trip.bullet.6': '日程のツールバーにある元に戻す矢印は、計画への最後の変更を取り消します。',
  // add-member
  'help.guide.add-member.title': 'メンバーを追加する',
  'help.guide.add-member.goal': 'TREKアカウントを持つ人にこの旅行へのアクセスを与えます。',
  'help.guide.add-member.step.1': '右上の「共有」をクリックします。',
  'help.guide.add-member.step.2': '「ユーザーを招待」で一覧からその人を選び、「招待」をクリックします。',
  'help.guide.add-member.step.3':
    'その人が「アクセス」に表示されるようになります。王冠はオーナーの印です。行の末尾のアイコンでアクセスを再び削除できます。',
  'help.guide.add-member.result':
    'メンバーはあなたと同じように旅行を見て編集できます。管理者が「権限設定」で決めたレベルの範囲内です。',
  'help.guide.add-member.tip.1':
    '一覧にない人はまだTREKアカウントを持っていません。ゲストとして追加するか、招待リンクから登録してもらいます。',
  'help.guide.add-member.tip.2': '「アクセス」の横の数字は旅行の人数です。ゲストはその下に別に並びます。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'リンクで招待する',
  'help.guide.trip-invite-link.goal': '人が自分で旅行に参加できるようにします。',
  'help.guide.trip-invite-link.step.1':
    '「共有」をクリックし、「旅行の招待リンク」で「招待リンクを作成」をクリックします。',
  'help.guide.trip-invite-link.step.2':
    '「コピー」をクリックしてリンクを送ります。TREKアカウントを持つ人がそれを開くと、メンバーとして参加します。',
  'help.guide.trip-invite-link.step.3':
    '「再生成」はリンクを置き換え、古いものを無効にします。「無効にする」はリンクをオフにします。',
  'help.guide.trip-invite-link.result': 'リンクを開いた人は旅行に入り、「アクセス」に表示されます。',
  'help.guide.trip-invite-link.tip.1':
    'アカウントのない人は使えません。管理者は「管理」の「ユーザー」で登録リンクを配布でき、それをこの旅行に結びつけることもできます。',
  'help.guide.trip-invite-link.tip.2':
    'リンクを間違ったチャットに送ってしまったら再生成してください。古いリンクはすぐに使えなくなります。',
  // add-guest
  'help.guide.add-guest.title': 'アカウントのないゲストを追加する',
  'help.guide.add-guest.goal': 'TREKを使っていない人を旅行に数えます。',
  'help.guide.add-guest.step.1': '「共有」をクリックし、「ゲスト」までスクロールします。',
  'help.guide.add-guest.step.2': '「ゲスト名」に名前を入力し、「ゲストを追加」をクリックします。',
  'help.guide.add-guest.result': 'ゲストは費用、持ち物、タスクに割り当てできますが、ログインはできません。',
  'help.guide.add-guest.tip.1':
    '鉛筆でゲストの名前を変えられます。行の末尾のアイコンは、負担分と割り当てごとゲストを削除します。',
  'help.guide.add-guest.tip.2': 'その人が後でアカウントを作ったら、メンバーとして招待し、ゲストを削除してください。',
  // public-link
  'help.guide.public-link.title': '読み取り専用リンクを公開する',
  'help.guide.public-link.goal': '編集させたくない人に旅行を見せます。',
  'help.guide.public-link.step.1':
    '「共有」をクリックし、右側の「公開リンク」でリンクに表示してよいものにチェックを付けます。「地図・プラン」は常にオンです。「予約」「持ち物」「費用」「チャット」はあなたが選びます。',
  'help.guide.public-link.step.2': '「リンク作成」をクリックし、次に「コピー」をクリックします。',
  'help.guide.public-link.step.3': 'チェックはリンクがある間いつでも変えられます。「リンク削除」でリンクは止まります。',
  'help.guide.public-link.result': 'リンクを持つ人は、ログインせずに選ばれた部分を見られますが、何も変更できません。',
  'help.guide.public-link.tip.1':
    'このリンクはどこにも一覧されません。持っている人は誰でも開けるので、パスワードのように扱ってください。',
  'help.guide.public-link.tip.2': '編集権限が必要なら、代わりにその人をメンバーとして追加してください。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '旅行を引き渡す、または退出する',
  'help.guide.transfer-ownership.goal': 'ほかの人をオーナーにするか、自分のものではない旅行から抜けます。',
  'help.guide.transfer-ownership.step.1':
    '「共有」をクリックします。「アクセス」でメンバーの行の王冠をクリックすると、その人がオーナーになります。確認の質問に答えます。',
  'help.guide.transfer-ownership.step.2':
    '自分の行の「旅行を退出」で旅行から抜けます。オーナーの場合は、先に引き渡してください。',
  'help.guide.transfer-ownership.result':
    '新しいオーナーがメンバーを管理し、旅行を削除できます。あなたは通常のメンバーとして残ります。',
  'help.guide.transfer-ownership.tip.1':
    '引き渡すまで、旅行を作った人がオーナーです。旅行の削除はオーナーだけができます。',
  'help.guide.transfer-ownership.tip.2':
    'ほかの人の行にある「アクセスを削除」は同じボタンの逆向きです。オーナーがメンバーを外します。',
  // collapse-columns
  'help.guide.collapse-columns.title': '地図のためにスペースを空ける',
  'help.guide.collapse-columns.goal': '列を折りたたむか、列の幅を広げます。',
  'help.guide.collapse-columns.step.1':
    '日程の列の内側の端にあるシェブロンをクリックして折りたたみます。地図がそのスペースを使います。場所の列にも同じシェブロンがあります。',
  'help.guide.collapse-columns.step.2': 'シェブロンをもう一度クリックすると列が戻ります。',
  'help.guide.collapse-columns.step.3': '列と地図の間にある細い仕切りをドラッグして、列の幅を変えます。',
  'help.guide.collapse-columns.result': '幅は記憶されます。次に開いたとき、列は開いた状態で戻ります。',
  'help.guide.collapse-columns.tip.1': '両方の列を同時に折りたたむと、地図だけの表示になります。',
  'help.guide.collapse-columns.tip.2':
    'スマートフォンには列がありません。「計画」と「場所」が地図の下部にある2つのボタンです。',
  // undo-change
  'help.guide.undo-change.title': '最後の変更を元に戻す',
  'help.guide.undo-change.goal': '計画にたった今行ったことを取り消します。',
  'help.guide.undo-change.step.1':
    '日程の上のツールバーにある元に戻す矢印をクリックします。ツールチップに、取り消される変更が表示されます。',
  'help.guide.undo-change.result': '計画は元の状態に戻り、矢印は次の変更までグレーになります。',
  'help.guide.undo-change.tip.1':
    '元に戻すの対象は計画です。場所の割り当て・取り外し・並び替え・移動、ルートの最適化、場所の削除、カテゴリの変更、インポートです。',
  'help.guide.undo-change.tip.2':
    '深さは1段階です。取り消せるのは最新の変更だけで、新しい変更があるとそれに置き換わります。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '場所',
  'help.ctx.trip-places.summary':
    '計画の右の列です。旅行のすべての場所が、計画済みかどうかにかかわらず、検索とフィルターとともに並びます。場所を取り込む方法も、手入力、ファイルから、共有リストからと、ここにあります。',
  'help.ctx.trip-places.bullet.1':
    '上の「場所／アクティビティを追加」は、入力または検索した場所のフォームを開きます。日が開いている間はボタンが「新しい場所」になり、その隣の「この日へ」は場所をそのままその日に作ります。',
  'help.ctx.trip-places.bullet.2':
    '「ファイルをインポート」は .gpx、.kml、.kmz ファイルを受け取ります。「リストをインポート」は共有された Google Maps または Naver Maps のリストを受け取ります。ファイルはこの列にドロップするだけでも構いません。',
  'help.ctx.trip-places.bullet.3':
    'ドロップダウンは「すべて」「未計画」「計画済み」を切り替え、トラックをインポートすると「トラック」も加わります。その下に検索、カテゴリのフィルター、最低評価の星があります。',
  'help.ctx.trip-places.bullet.4':
    '行には写真、名前、説明または住所が出ます。クリックすると場所の詳細が開き、日にドラッグすれば割り当てられ、右クリックすると「編集」「+ 日」「Webサイトを開く」「Google Maps」「コレクションに保存」「削除」が出ます。',
  'help.ctx.trip-places.bullet.5':
    '日が開いていると、未計画の行の末尾の + がその場所をその日に置き、「計画済み」はその日だけを並べます。「旅行全体を表示」でまた広げられます。',
  'help.ctx.trip-places.bullet.6':
    'フィルター行の右端のチェックは選択を始めます。複数の行が一度に新しいカテゴリを受け取り、コレクションに入り、または削除されます。',
  // create-place
  'help.guide.create-place.title': '場所を作る',
  'help.guide.create-place.goal': '計画が知っておくべきことをすべて添えて、場所やアクティビティを手で追加します。',
  'help.guide.create-place.step.1':
    '場所の列の上にある「場所／アクティビティを追加」をクリックします（日が開いている間は「新しい場所」）。フォームが開きます。',
  'help.guide.create-place.step.2':
    '上の「場所を検索…」に場所を入力し、結果を選びます。「名前」「住所」「緯度」「経度」「ウェブサイト」が埋まり、左の「場所の詳細」に写真、営業時間、説明が出ます。Google キーのある TREK では、「目的の場所ではない？ Google で検索」が一覧の下に出て、同じ検索を Google 経由で実行します。',
  'help.guide.create-place.step.3':
    '「場所の詳細」で「写真を選ぶ」の下の写真をクリックすると、それが場所の画像になります。「このテキストを使う」は説明をフォームに引き継ぎます。',
  'help.guide.create-place.step.4':
    '項目を確認します。「名前」は必須です。「説明」と「メモ」はあなたのものです。「住所」「緯度」「経度」は検索から入るか、自分で入力します。「カテゴリ」は旅行のカテゴリから1つを選び、その隣の + はその場で新しいカテゴリを作ります。「ウェブサイト」にはリンクを入れます。',
  'help.guide.create-place.step.5':
    '「追加」をクリックします。同じ名前の場所がすでに旅行にある場合、フォームがそれを伝え、ボタンは「それでも追加」に変わります。',
  'help.guide.create-place.result': '場所はリストと地図にあります。日に置かれるまでは「未計画」の下です。',
  'help.guide.create-place.tip.1':
    'フォームの下の「ファイル」と「費用」は、場所に書類を添付するか、保存の直後にその支出の「費用」エディターを開きます。',
  'help.guide.create-place.tip.2':
    'どの TREK でも検索に答えるのは TREK のインデックスと OpenStreetMap で、「場所の詳細」は Wikipedia、Wikivoyage、Wikimedia から自分を埋めます。Google が尋ねられるのは、その両方が空のときだけで、評価をもたらすのは Google だけです。',
  'help.guide.create-place.tip.3':
    '場所は地図から始めることもできます。その地点を右クリックすると、座標と住所が入った状態でフォームが開きます。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '開いている日に直接場所を追加する',
  'help.guide.place-to-open-day.goal': '2つ目の手順を省きます。場所を作るか選ぶかして、その日に一度で入れます。',
  'help.guide.place-to-open-day.step.1':
    '日程の列で日のヘッダーをクリックします。その日が開きます。カードが強調され、場所の列に「この日へ」ボタンが出ます。',
  'help.guide.place-to-open-day.step.2':
    '「この日へ」は「新しい場所」と同じフォームを開きますが、「追加」をクリックした瞬間に場所が開いている日に入ります。',
  'help.guide.place-to-open-day.step.3':
    'すでにある場所は、行の末尾の + で、または右クリックの「+ 日」で開いている日に入ります。',
  'help.guide.place-to-open-day.step.4':
    '逆の手順も使えますし、先に日を開いておく必要もありません。地点の行を列から外へドラッグし、日のカードの上で離してください。2つの立ち寄り先の間で離せば、ちょうどそこに入ります。',
  'help.guide.place-to-open-day.result':
    '場所はその日の下、最後に並びます。上下にドラッグして、あるべき位置へ動かしてください。',
  'help.guide.place-to-open-day.tip.1':
    '開いている日は検索にも効きます。日が開いていると、地図も周辺検索も、その日がもともと向かう場所から始まります。',
  'help.guide.place-to-open-day.tip.2': '日程の上のツールバーにある「元に戻す」は、この割り当てを取り消します。',
  // filter-places
  'help.guide.filter-places.title': 'リストで場所を見つける',
  'help.guide.filter-places.goal': '探している場所まで列を絞り込みます。',
  'help.guide.filter-places.step.1':
    '上のドロップダウンは「すべて」「未計画」（まだどの日にもない）「計画済み」（日にある）「トラック」（インポートした GPX トラック）を切り替え、それぞれに件数が付きます。',
  'help.guide.filter-places.step.2': '「場所を検索…」に入力します。入力するにつれてリストが絞られます。',
  'help.guide.filter-places.step.3':
    '「すべてのカテゴリ」は、カテゴリを1つ以上チェックする一覧を開きます。「カテゴリなし」もそこにあります。一番下の「フィルター解除」で元に戻ります。',
  'help.guide.filter-places.step.4':
    'その隣の星は最低評価を決めます。5+、4+ などは、あなたがそれ以上に評価した場所だけを表示します。',
  'help.guide.filter-places.result': '行の上の数が、いくつの場所が一致するかを示します。フィルターは組み合わさります。',
  'help.guide.filter-places.tip.1':
    '日が開いていると、「計画済み」はその日だけを並べ、そう伝えます。「開いている日のみ表示中」と、その隣に「旅行全体を表示」です。',
  'help.guide.filter-places.tip.2':
    '地図も開いている日に絞られます。リストの「すべて」は変わらず旅行のすべての場所を示します。',
  // edit-place
  'help.guide.edit-place.title': '場所を変更する',
  'help.guide.edit-place.goal': '名前を直す、ピンを動かす、ウェブサイトを足す、カテゴリを変える。',
  'help.guide.edit-place.step.1':
    '行を右クリックして「編集」を選ぶか、場所を開いてその詳細で「編集」をクリックします。',
  'help.guide.edit-place.step.2':
    '必要なところを変えます。「名前」「説明」「メモ」「住所」「緯度」「経度」「カテゴリ」「ウェブサイト」。日から開いた場合は、その日のための「この日のメモ」と「開始」「終了」もフォームにあります。',
  'help.guide.edit-place.step.3': '「更新」をクリックします。',
  'help.guide.edit-place.result':
    '変更は、その場所が現れるすべてのところに及びます。リスト、地図、そしてその場所があるすべての日です。',
  'help.guide.edit-place.tip.1': '「この日のメモ」はその1日の場所に属します。「メモ」は場所そのものに属します。',
  'help.guide.edit-place.tip.2':
    '「開始」より前の「終了」は「更新」を止めます。「時間が重複しています：」は、その日の別の立ち寄り先が同じ時間だと知らせるだけです。',
  // delete-place
  'help.guide.delete-place.title': '場所を削除する',
  'help.guide.delete-place.goal': '場所を旅行から完全に取り除きます。',
  'help.guide.delete-place.step.1': '行を右クリックして「削除」を選ぶか、場所の詳細で「削除」をクリックします。',
  'help.guide.delete-place.step.2':
    '確認します。その場所に宿泊が予約されている場合や、予約が結び付いている場合は、何が一緒に消えるかを質問が伝えます。',
  'help.guide.delete-place.result':
    '場所はリスト、地図、すべての日から消えます。日程の上のツールバーにある「元に戻す」が戻します。',
  'help.guide.delete-place.tip.1':
    '1日だけから場所を外すには、代わりにその立ち寄り先で「この日から削除」を使ってください。',
  'help.guide.delete-place.tip.2': '複数の場所を一度に扱うなら、フィルターの隣のチェックが選択を始めます。',
  // select-places
  'help.guide.select-places.title': '複数の場所を一度に変更または削除する',
  'help.guide.select-places.goal': '1つずつではなく、一度でリストを整えます。',
  'help.guide.select-places.step.1':
    'フィルター行の右端のチェックをクリックします。行にチェックボックスが付き、操作の並んだバーが現れます。',
  'help.guide.select-places.step.2':
    '行にチェックを付けるか、バーの「すべて選択」を使います。バーは選ばれた数を数えます。',
  'help.guide.select-places.step.3':
    '「Change category」はすべてに1つのカテゴリを与えます。「コレクションに保存」はそれらをあなたのコレクションの1つにコピーします。「選択を削除」は確認のあとそれらを取り除きます。',
  'help.guide.select-places.step.4': 'もう一度チェックをクリックすると選択を抜けます。',
  'help.guide.select-places.result': '変更は選んだすべての場所に及びます。削除は日程の上のツールバーから元に戻せます。',
  'help.guide.select-places.tip.1':
    '選択中もフィルターは効いています。先に「未計画」で絞れば、「すべて選択」はちょうどそれらだけを捕まえます。',
  'help.guide.select-places.tip.2':
    'コレクションのアドオンが有効だと、バーに「リストで訪問済みにする」が出ます。保存されているコレクションの中で、その場所にチェックを付けます。',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX、KML、KMZ ファイルから場所をインポートする',
  'help.guide.import-places-file.goal': 'Google My Maps、Google Earth、GPS トラッカーが書き出したものを取り込みます。',
  'help.guide.import-places-file.step.1':
    '「ファイルをインポート」をクリックするか、場所の列のどこかにファイルをドロップします。',
  'help.guide.import-places-file.step.2':
    'ファイルを選ぶか、枠にドラッグします。GPX では何をインポートするかにチェックを付けます。「ウェイポイント」「ルート」「トラック（経路付き）」です。KML と KMZ では「ポイント（プレースマーク）」と「パス（ライン）」です。',
  'help.guide.import-places-file.step.3':
    '枠は複数のファイルを一度に受け取りますが、.gpx、.kml、.kmz だけです。それ以外の種類のファイルや、10 MB を超えるファイルは、ダイアログで拒否され、インポートされません。',
  'help.guide.import-places-file.step.4':
    '「インポート」をクリックします。いくつの場所が入ったかがメッセージで出ます。KML や KMZ のファイルでは、何が作られ何が飛ばされたかのまとめを付けて、ダイアログが開いたままになります。',
  'help.guide.import-places-file.result':
    '場所はリストに入ります。トラックは行にルートの印が付き、地図に描かれ、専用の「トラック」フィルターを得ます。',
  'help.guide.import-places-file.tip.1':
    '大きすぎるファイルはサイズ上限とともに拒否されます。写真なしで書き出し直すか、分割してください。',
  'help.guide.import-places-file.tip.2': 'インポートは日程の上のツールバーからまとめて元に戻せます。',
  // import-places-list
  'help.guide.import-places-list.title': '共有された Google Maps または Naver Maps のリストをインポートする',
  'help.guide.import-places-list.goal': '共有リストのリンクを場所に変えます。',
  'help.guide.import-places-list.step.1':
    '「リストをインポート」をクリックし、「Google リスト」か「Naver リスト」を選びます。',
  'help.guide.import-places-list.step.2':
    'リストの共有リンクを貼り付けます。Google Maps の経路リンクでも構いません。その立ち寄り先が、走る順に場所になります。',
  'help.guide.import-places-list.step.3': '「インポート」をクリックします。',
  'help.guide.import-places-list.result':
    'リストのすべての場所が旅行に入り、名前はリストのままです。すでに旅行にある場所は飛ばされます。',
  'help.guide.import-places-list.tip.1':
    'リストは公開で共有されている必要があります。非公開のリストのリンクは何もインポートしません。',
  'help.guide.import-places-list.tip.2':
    '「Googleで場所を補完」は、あなたの TREK に Google キーがあるときにダイアログに出ます。インポートした場所を一つずつ調べて、写真、住所、詳細を埋めます。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '日',
  'help.ctx.trip-days.summary':
    '計画の左の列です。1日につき1枚のカードに、その日の立ち寄り先が順番に、メモ、その日の予約と移動、そして立ち寄り先をつなぐルートが並びます。旅行が実際に計画されるのはここです。',
  'help.ctx.trip-days.bullet.1':
    '上部のツールバー。「エクスポート」（PDF、カレンダー、GPX）、「すべての日を展開」「すべての日を折りたたむ」、元に戻す矢印、「日付を並べ替え」、「すべての予約ルートを表示」があります。',
  'help.ctx.trip-days.bullet.2':
    '日のカード。ヘッダーには日数、天気、タイトル、日付、その日の費用が出ます。ヘッダーをクリックするとその日が開き、山形のアイコンで折りたためます。「公共交通機関」「移動手段を追加」「メモを追加」もヘッダーにあります。',
  'help.ctx.trip-days.bullet.3':
    '日の中には、順番に並んだ立ち寄り先（それぞれ写真、名前、時刻、写真の上の鍵つき）、メモ、その日に属する予約、そして立ち寄り先の間には各区間の所要時間があります。',
  'help.ctx.trip-days.bullet.4':
    '立ち寄り先の下はルートバーです。「ルート」はその日を地図に描き、「最適化」は立ち寄り先を並べ替え、「車」「徒歩」はその日の移動手段を決め、「Googleマップで開く」「CoMapsで開く」はその日を渡します。',
  'help.ctx.trip-days.bullet.5':
    '場所は、場所の列から行をドラッグして、その行の +、空の日の「この日に場所を追加」、または場所の詳細から日に入ります。',
  'help.ctx.trip-days.bullet.6': '一番下の「合計費用」は、価格のあるすべての立ち寄り先と予約を旅行の通貨で合計します。',
  // read-day-plan
  'help.guide.read-day-plan.title': '日を読む',
  'help.guide.read-day-plan.goal': '何かを変える前に、日のカードの各部分が何を伝えているかを知ります。',
  'help.guide.read-day-plan.step.1':
    'ヘッダー。日数、その日の予報、「1日目」またはあなたが付けたタイトル、日付、その日の費用です。ヘッダーをクリックするとその日が開き（「日詳細」のパネルが地図の上に出ます）、右の山形のアイコンでカードを折りたたんだり開いたりできます。',
  'help.guide.read-day-plan.step.2':
    '立ち寄り先。左のつまみでドラッグでき、写真にはルート最適化用の鍵があり、続いて名前、説明、設定してあれば「この日のメモ」が出ます。時刻がある立ち寄り先には「開始」と「終了」を示す時刻バッジが付き、右端に出る矢印で上下に動かせます。',
  'help.guide.read-day-plan.step.3':
    'その日の予約。立ち寄り先に紐づいた予約はその立ち寄り先を「予約確定」または「予約保留」と示し、移動手段は「出発」または「到着」として時刻と経路つきで出て、小さなトグルがその経路を地図に描きます。',
  'help.guide.read-day-plan.step.4':
    '2つの立ち寄り先の間のコネクターは、その日の移動手段でその区間の所要時間と距離を示します。クリックすると、その1区間だけ手段を変えられます。',
  'help.guide.read-day-plan.step.5':
    '最後のルートバー。「ルート」はその日の道を地図に描き、「最適化」は立ち寄り先を並べ替え、手段のボタンは「車」か「徒歩」を選び、「Googleマップで開く」「CoMapsで開く」はその日をそのアプリで開きます。',
  'help.guide.read-day-plan.result': 'カードの記号にはどれも意味があります。下のガイドがそれぞれを変えていきます。',
  'help.guide.read-day-plan.tip.1':
    '立ち寄り先を右クリックするとメニューが出ます。「編集」「この日から削除」「Webサイトを開く」、ナビのアプリ（Google Maps、Waze、Apple Maps、OpenStreetMap、CoMaps）、「コレクションに保存」「削除」です。',
  'help.guide.read-day-plan.tip.2':
    '立ち寄り先にカーソルを合わせると末尾に「予約を追加」が出ます。そこで作った予約は、この日のこの立ち寄り先に紐づきます。',
  // place-onto-day
  'help.guide.place-onto-day.title': '場所を日に置く',
  'help.guide.place-onto-day.goal': 'リストの場所を、順番の中のあるべき位置にある、その日の立ち寄り先にします。',
  'help.guide.place-onto-day.step.1':
    '場所の列から行を日のカードにドラッグします。2つの立ち寄り先の間に落とせばちょうどそこに入り、カードのどこかに落とせば末尾に追加されます。',
  'help.guide.place-onto-day.step.2':
    'ドラッグせずに行うには、ヘッダーをクリックして日を開き、場所の行の末尾の + をクリックするか、行を右クリックして「+ 日」を選びます。',
  'help.guide.place-onto-day.step.3':
    '空の日では「この日に場所を追加」が場所のフォームを開き、新しい場所はそのままその日に入ります。',
  'help.guide.place-onto-day.step.4':
    '場所の詳細からは「日に追加」がどの日かを尋ねます。日が開いているときは、場所の列の「この日へ」が開いている日に新しい場所を作ります。',
  'help.guide.place-onto-day.result':
    'その場所はその日の立ち寄り先になり、地図にはその日の番号つきで出て、場所の列では「計画済み」に数えられます。',
  'help.guide.place-onto-day.tip.1':
    '1つの場所を複数の日に置けます。2日目には場所の列から置いてください。立ち寄り先をある日のカードから別のカードへドラッグすると、置くのではなく移動になります。',
  'help.guide.place-onto-day.tip.2': 'ツールバーの元に戻す矢印で、この割り当てを取り消せます。',
  'help.guide.place-onto-day.tip.3':
    '時刻が固定された2つの項目の間や、すでに時刻のある予約の前には、立ち寄り先を落とせません。計画は時系列を保ちます。',
  // reorder-stops
  'help.guide.reorder-stops.title': '日の順番を変える',
  'help.guide.reorder-stops.goal': '立ち寄り先を上下に、または別の日に動かします。',
  'help.guide.reorder-stops.step.1': '立ち寄り先をつまみでつかみ、カード内の新しい位置へドラッグします。',
  'help.guide.reorder-stops.step.2': 'または立ち寄り先の右端の矢印を使います。1回のクリックで1つ上または下に動きます。',
  'help.guide.reorder-stops.step.3': '立ち寄り先を別の日のカードにドラッグするとそちらに移り、元の日からは外れます。',
  'help.guide.reorder-stops.step.4':
    '時刻が固定された立ち寄り先は、その移動がその日の順番を崩すときに「時刻を削除しますか？」と尋ねます。位置を決めていたのはその時刻だからです。「確認」を押すと時刻を捨て、どこへでも動かせるようになります。',
  'help.guide.reorder-stops.result': 'ルートと所要時間はすぐに新しい順番に従います。',
  'help.guide.reorder-stops.tip.1': '時刻が固定された予約は並び替えできません。その時刻が決める位置にとどまります。',
  'help.guide.reorder-stops.tip.2':
    'ルートバーの「最適化」は1日全体を最短の道順に並べます。動かしたくない立ち寄り先は先に鍵をかけてください。',
  // set-stop-times
  'help.guide.set-stop-times.title': '立ち寄り先に時刻を付ける',
  'help.guide.set-stop-times.goal': '立ち寄り先の開始と終了を決め、その日が予定表のように読めるようにします。',
  'help.guide.set-stop-times.step.1':
    '立ち寄り先を右クリックして「編集」を選びます。日から開いたフォームには、下に「開始」と「終了」があります。',
  'help.guide.set-stop-times.step.2':
    '「開始」を、必要なら「終了」も入力します。「時間が重複しています：」はその日の別の時刻付き立ち寄り先と重なっていることを知らせます。「開始」より前の「終了」は「更新」を止めます。',
  'help.guide.set-stop-times.step.3':
    '「更新」をクリックします。立ち寄り先に時刻バッジが付き、その日の中で時刻にふさわしい位置に移ります。',
  'help.guide.set-stop-times.result':
    '時刻のある立ち寄り先は順番の中の位置を保ち、時刻のないものはその周りに並びます。',
  'help.guide.set-stop-times.tip.1':
    '時刻はその日のその立ち寄り先のものです。同じ場所でも別の日には別の時刻を持てます。',
  'help.guide.set-stop-times.tip.2':
    '時刻のある立ち寄り先を手で動かすにはドラッグします。「確認」を押せば、「時刻を削除しますか？」の問いがその途中で時刻を捨てます。',
  'help.guide.set-stop-times.tip.3':
    '同じフォームの「この日のメモ」には、その日だけに当てはまること、予約した席、チケット番号などを入れます。',
  // remove-from-day
  'help.guide.remove-from-day.title': '立ち寄り先を日から外す',
  'help.guide.remove-from-day.goal': '旅行から削除せずに、場所の計画を外します。',
  'help.guide.remove-from-day.step.1': '立ち寄り先を右クリックして「この日から削除」を選びます。',
  'help.guide.remove-from-day.step.2':
    '立ち寄り先はその日から消えます。場所は場所の列に残り、ほかの日にもなければ「未計画」の下に入ります。',
  'help.guide.remove-from-day.result': 'その日とルートと費用が更新されます。元に戻す矢印で立ち寄り先は戻ります。',
  'help.guide.remove-from-day.tip.1':
    '同じメニューの「削除」は、その場所を旅行全体から、すべての日を含めて取り除きます。',
  'help.guide.remove-from-day.tip.2': '「この日から削除」は場所の詳細パネルにも、「日に追加」の隣にあります。',
  // lock-stop
  'help.guide.lock-stop.title': '立ち寄り先を固定する',
  'help.guide.lock-stop.goal': 'ルートを最適化しても、立ち寄り先をその位置に保ちます。',
  'help.guide.lock-stop.step.1':
    '立ち寄り先の写真にカーソルを合わせて鍵をクリックします。「最適化中も位置を保持」です。',
  'help.guide.lock-stop.step.2':
    'これで「最適化」はほかの立ち寄り先をその周りに並べます。もう一度鍵をクリックすると（「クリックして解除」）外れます。',
  'help.guide.lock-stop.result': '鍵は写真の上に出ます。解除するまで立ち寄り先は位置を保ちます。',
  'help.guide.lock-stop.tip.1': '時刻が固定された立ち寄り先はその時刻で固定されていて、最適化でも決して動きません。',
  'help.guide.lock-stop.tip.2':
    '鍵はこの滞在の間だけ持ちます。再読み込みのあとはすべての立ち寄り先が自由になり、固定されたままなのは時刻のあるものだけです。',
  // day-note
  'help.guide.day-note.title': '日にメモを追加する',
  'help.guide.day-note.goal': '覚え書き、チケット番号、代替案をその日の中に置いておきます。',
  'help.guide.day-note.step.1': '日のヘッダーで「メモを追加」をクリックします。',
  'help.guide.day-note.step.2':
    '「メモ」に名前を付けます。日のカードに出るのはこれです。残りは「日別メモ」に書きます。その上の「書式」ツールバーが文字の体裁を整え（「太字」「箇条書き」「番号付きリスト」「リンク」「引用」）、左の「プレビュー」ができあがるカードを見せます。',
  'help.guide.day-note.step.3': '「アイコン」と「色」を選んでメモを立ち寄り先から目立たせ、「追加」します。',
  'help.guide.day-note.step.4':
    'メモは立ち寄り先と同じように日の中に並びます。ドラッグして位置を決め、右クリックで「編集」と「削除」が出ます。',
  'help.guide.day-note.result':
    'メモはその日の一部で、PDF にも入ります。時刻のあるメモは時刻のある立ち寄り先と一緒に並びます。',
  'help.guide.day-note.tip.1':
    '時刻付きのメモは、予約のない移動の代わりになります。たとえば「08:15 中央駅から S3」です。',
  'help.guide.day-note.tip.2': 'メモは日ごとのものです。旅行全体へのメモは Collab に置きます。',
  // day-route
  'help.guide.day-route.title': 'その日のルートを表示して最適化する',
  'help.guide.day-route.goal': '立ち寄り先の間の道を見て、移動の仕方を選び、順番は TREK に並べさせます。',
  'help.guide.day-route.step.1':
    '日を開き、ルートバーの「ルート」をクリックします。立ち寄り先の間の道が地図に描かれ、立ち寄り先の間のコネクターが各区間の時間と距離を示します。',
  'help.guide.day-route.step.2':
    'その隣の「車」と「徒歩」がその日の移動手段を決め、各区間が計算し直されます。プラグインが独自の手段を加えることもできます。',
  'help.guide.day-route.step.3':
    'コネクターをクリックするとその1区間だけ手段を変えられます。手段を選ぶか、「1日のデフォルトを使用」でその日の手段に戻します。',
  'help.guide.day-route.step.4':
    '「最適化」は立ち寄り先を最短の道順に並べ替えます。鍵のあるものや時刻が固定されたものは位置を保ちます。その日に宿泊先があれば、ルートはそこから始まります。',
  'help.guide.day-route.step.5':
    '「Googleマップで開く」または「CoMapsで開く」は、1日全体をルートとしてそのアプリで開きます。道中のナビ用です。',
  'help.guide.day-route.result':
    'その日は時間付きのルートになります。順番が変わると「合計費用」と各区間が更新されます。',
  'help.guide.day-route.tip.1':
    'ルートは既定では OSRM から来ます。管理者は「ユーザーのデフォルト」で TREK を別のルーティングエンジンに向けられます。',
  'help.guide.day-route.tip.2':
    'ルートを引けなかった区間には時間が出ません。両方の立ち寄り先に座標があるか確認してください。',
  'help.guide.day-route.tip.3': '元に戻す矢印で最適化を取り消せます。',
  // manage-days
  'help.guide.manage-days.title': '日を追加し、並べ替え、名前を変える',
  'help.guide.manage-days.goal': '日に載っているものだけでなく、日そのものを形づくります。',
  'help.guide.manage-days.step.1':
    '日は旅行の日付から作られます。「ダッシュボード」の旅行カードで日付を変えると、端で日が足されたり落とされたりします。中身のある日が落とされる前に、どの日が消え、そこに何があるかを一覧で示します。',
  'help.guide.manage-days.step.2':
    'ツールバーの「日付を並べ替え」はリストを開きます。「上へ移動」「下へ移動」はその日を載っているものごと動かし、隣のゴミ箱「日を削除」はその日を取り除きます。リストの下では、次の日付のボタンが最後の日付付きの日のすぐ後に1日足して旅行を1日延ばし、「日付なし」は日付のない日を末尾に足します。',
  'help.guide.manage-days.step.3':
    '「日を削除」はまず確認します。一覧には、その日と一緒に消えるもの（スポット、メモ、予約）、その日にチェックインまたはチェックアウトする宿泊、1日前にずれる日が表示されます。「日を削除」で取り除き、「キャンセル」で残します。最後の1日は削除できません。',
  'help.guide.manage-days.step.4':
    '日の名前を変えるには、その日を開き、地図の上の「日詳細」パネルでタイトルの隣の鉛筆をクリックします。その名前がカードと PDF の「1日目」に代わります。',
  'help.guide.manage-days.step.5':
    'ツールバーの「すべての日を展開」「すべての日を折りたたむ」はすべてのカードを一度に開閉します。1枚だけなら山形のアイコンで折りたためます。',
  'help.guide.manage-days.result':
    '日付は位置に付いたままです。上に動かした日は前の日付を受け取り、その立ち寄り先、メモ、予約は一緒に移動します。',
  'help.guide.manage-days.tip.1': '日の移動はツールバーから取り消せますが、日の削除は取り消せません。',
  'help.guide.manage-days.tip.2': '日のヘッダーの費用は、その日の価格のある立ち寄り先と予約を合計します。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '計画の中の予約と移動を読む',
  'help.guide.bookings-in-plan.goal': '予約ができたらどこに出るのか、どの画面で作るのかを知ります。',
  'help.guide.bookings-in-plan.step.1':
    '移動（航空便、列車、フェリー、バス、レンタカー）は、出発する日には「出発」として、到着する日には「到着」として、時刻と経路つきで出ます。複数日にまたがるものは、その間の日々をまたぎます。',
  'help.guide.bookings-in-plan.step.2':
    '立ち寄り先に紐づいた予約（レストラン、ツアー）は、その立ち寄り先を「予約確定」または「予約保留」と示します。日はあるが立ち寄り先のない予約は、その日の独立した行になります。',
  'help.guide.bookings-in-plan.step.3':
    'ホテルの宿泊は宿泊の予約です。その日の「日詳細」パネルの「宿泊先」に、「チェックイン」から「チェックアウト」まで並び、その各日のルートはそこから始まります。',
  'help.guide.bookings-in-plan.step.4':
    '地図では、移動の行のトグルがその経路を描きます。ツールバーの「すべての予約ルートを表示」はすべてを描きます。',
  'help.guide.bookings-in-plan.step.5':
    '作る場所は、カーソルを合わせた立ち寄り先の「予約を追加」、日のヘッダーの「移動手段を追加」と「公共交通機関」、そしてインポートとファイルを備えた一覧である「予約」タブと「移動」タブです。',
  'help.guide.bookings-in-plan.result':
    '1つの予約は計画の中の1か所にあります。タブはその同じ予約を一覧にしたものです。',
  'help.guide.bookings-in-plan.tip.1':
    '「確定」と「保留」は、あなたが予約に付ける状態です。計画は立ち寄り先の上にそれを示し、「予約」タブは両方を数えます。',
  'help.guide.bookings-in-plan.tip.2':
    '時刻が固定された移動はドラッグできません。代わりに予約の中で時刻を変えてください。',
  // export-plan
  'help.guide.export-plan.title': '計画をエクスポートする',
  'help.guide.export-plan.goal': '計画を書類として、カレンダーに、あるいは GPS に持ち出します。',
  'help.guide.export-plan.step.1': '日の上のツールバーで「エクスポート」をクリックします。',
  'help.guide.export-plan.step.2':
    '「書類」。「PDF」はすべての日を立ち寄り先、メモ、予約つきで印刷表示に開きます。「日ごとに改ページ」は各日を新しいページから始め、「PDFとして保存」がそれをダウンロードします。',
  'help.guide.export-plan.step.3':
    '「カレンダー」。「.ics をダウンロード」は予約をカレンダーファイルとして保存します。「カレンダーを購読」は、カレンダーアプリが自分で更新するリンクを渡します。',
  'help.guide.export-plan.step.4':
    '「地図と GPS · GPX」。「旅行全体」は場所、日のルート、トラックを書き出します。「場所のみ」はピンだけ、「日程をルートとして」は1日につき1本のルートで、オフライン地図と GPS 機器向けです。',
  'help.guide.export-plan.result': 'ファイルがダウンロードされます。旅行の中身は何も変わりません。',
  'help.guide.export-plan.tip.1':
    '1日だけなら、そのルートバーから地図アプリへ渡せます。「Googleマップで開く」または「CoMapsで開く」です。',
  'help.guide.export-plan.tip.2':
    '「カレンダーを購読」には、設定でカレンダー購読が有効になっている必要があります。「ダッシュボード」にそのガイドがあります。',
  'help.guide.export-plan.tip.3': 'エクスポートは読むことです。旅行のすべてのメンバーができます。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '場所の詳細',
  'help.ctx.trip-place.summary':
    '場所を選ぶと地図の上に開くカードです。旅行がその場所について知っていることのすべて、みんながつけた星、写真とファイル、そして開いている日に置く、リストに入れる、地図アプリで開くためのボタンがここにあります。',
  'help.ctx.trip-place.bullet.1':
    '場所の列の行、日の中の立ち寄り先、または地図のマーカーをクリックすると、カードが地図の上に開きます。日の中で選ぶと、どの立ち寄り先のことかがカードに伝わり、それによって立ち寄り先の参加者と予約も一緒に出てきます。',
  'help.ctx.trip-place.bullet.2':
    'ヘッダーには丸い写真、名前、カテゴリ、住所、座標があります。写真をクリックすると自分の写真を使え、名前をダブルクリックするとその場で場所の名前を変えられ、右の X はカードを閉じます。',
  'help.ctx.trip-place.bullet.3':
    'その下には、値段があればその値段、旅行者それぞれがつけた星、説明とメモ、そして立ち寄り先が持っていれば「この日のメモ」が並びます。',
  'help.ctx.trip-place.bullet.4':
    '続いて「営業時間」「トラックの色」「統計を記録」「ファイル」が、当てはまる範囲で並びます。「ファイル」はあなたのフォルダーから何でも受け取り、この立ち寄り先の予約にぶら下がっているものも一覧します。',
  'help.ctx.trip-place.bullet.5':
    '一番下の行には、日が開いている間は「日に追加」または「この日から削除」、そして「コレクションに保存」「ナビゲーション」「Webサイトを開く」「編集」「削除」があります。',
  'help.ctx.trip-place.bullet.6':
    '検索から選んだ場所は、TREK のインデックスや OpenStreetMap がその場所について知っていることを持っています。写真のまわりの緑の「営業中」または赤の「営業時間外」のリングはその場所自身の時計で判断され、星の下に電話番号があり、さらに下の「営業時間」は行にその日の時間を持ち、クリックすると一週間分が出て、ウェブサイトは「Webサイトを開く」の奥にあります。Google の評価は、Google キーのある TREK で Google を通じて見つけた場所にだけ出ます。',
  // read-place
  'help.guide.read-place.title': 'カードが場所について教えてくれること',
  'help.guide.read-place.goal': '旅行が1つの場所について知っていることのすべてを、1枚のカードで読みます。',
  'help.guide.read-place.step.1':
    '日程の列で、読みたい立ち寄り先をクリックします。カードが地図の上に開き、その立ち寄り先はその日の中で強調されたままになります。',
  'help.guide.read-place.step.2':
    'ヘッダーは丸い写真、名前、住所、正確な座標です。写真のまわりの「営業中」の緑のリング、または「営業時間外」の赤のリングは、TREK がその場所の営業時間を知っていれば、その場所自身の時計でいま開いているかどうかを伝えます。右の X でカードをまた閉じます。',
  'help.guide.read-place.step.3':
    'その下は旅行者それぞれがつけた星で、平均と投票数が付きます。まだ誰もつけていない間は「未評価」です。そのすぐ下に、場所が持っていれば電話番号があります。クリックすると番号が電話アプリに渡されます。',
  'help.guide.read-place.step.4':
    '次に説明、その下にメモがあります。どちらも場所のフォームに書いたテキストが描画されたもので、リストもリンクも太字もそのまま効きます。',
  'help.guide.read-place.step.5':
    '「参加者」はこの立ち寄り先に誰が行くかを示します。誰かを外すまでは全員が入っています。',
  'help.guide.read-place.step.6':
    'さらに下の「営業時間」。行にはいま見ている日の時間があり、クリックするとその日を太字にして一週間分が広がります。隣には「ファイル」があります。',
  'help.guide.read-place.result':
    'カードは X で閉じるか別の場所を選ぶまで開いたままで、一週間分の営業時間は広がったままで、そのカードが属する立ち寄り先は日程の列で強調されたままです。',
  'help.guide.read-place.tip.1':
    '場所の列から選ぶと、カードは場所は分かっても立ち寄り先は分からないので、参加者も予約も出ません。代わりに日の中の立ち寄り先を選べば、どちらも出ます。',
  'help.guide.read-place.tip.2':
    '名前をダブルクリックすると、フォームを開かずに場所の名前を変えられます。Enter で保存、Escape で変更を捨てます。',
  'help.guide.read-place.tip.3':
    '手で入力した場所はそのどれも見せません。カードはフォームにあることしか知りません。「編集」で開き、「場所を検索…」の下の候補からその場所を選んで「更新」をクリックすると、営業時間、電話番号、ウェブサイトが一緒に入ります。Google の評価には Google キーが要ります。',
  // rate-place
  'help.guide.rate-place.title': '場所を評価する',
  'help.guide.rate-place.goal': '場所に自分の星をつけ、ほかのみんながつけた星を見ます。',
  'help.guide.rate-place.step.1':
    '場所を開きます。星の行はヘッダーのすぐ下にあり、ここまでの投票の平均と、その件数をかっこ付きで示します。',
  'help.guide.rate-place.step.2':
    'つけたい星をクリックします。星の上を動かすにつれて星が埋まるので、これからつける数が見えます。',
  'help.guide.rate-place.step.3':
    'あなたの票はすぐに平均に入り、その横の顔が投票した人たちです。行にマウスを乗せると全員の星が見えます。',
  'help.guide.rate-place.step.4': '同じ平均は場所の列のその行にも出るので、良い場所がリストの中で目立ちます。',
  'help.guide.rate-place.result':
    'あなたの星は旅行のみんなが見られる形で場所に付き、リストの上のフィルター行の星は、下限に届く場所だけを残せるようになります。',
  'help.guide.rate-place.tip.1':
    '旅行者は誰でも評価できます。一部の人だけが「場所を追加／編集／削除」できる旅行でも同じです。',
  'help.guide.rate-place.tip.2':
    'すでにつけた星をクリックすると票を取り下げられます。投票する人が誰もいなくなると、場所はまた「未評価」と表示されます。',
  'help.guide.rate-place.tip.3':
    '星の横に顔として並ぶ投票者は最大6人までです。ツールチップは全員の名前を挙げ、あなたの票には印を付けます。',
  // place-image
  'help.guide.place-image.title': '場所に自分の写真を付ける',
  'help.guide.place-image.goal': '自動のサムネイルを自分の写真に差し替えます。',
  'help.guide.place-image.step.1': '場所の列から場所を開きます。',
  'help.guide.place-image.step.2':
    'ヘッダーの丸い写真にマウスを乗せると、カメラが現れ、ツールチップに「画像をアップロード」と出ます。クリックしてファイルを選びます。',
  'help.guide.place-image.step.3': 'ヘッダーにあなたの写真が出て、その角に小さな赤い X が付きます。',
  'help.guide.place-image.step.4': '同じ写真は場所の列のその行にも、地図のマーカーにも出ます。',
  'help.guide.place-image.result':
    'あなたの写真がどこでもその場所の写真になります。カード、場所の列、日の中の立ち寄り先、地図のマーカー、そして共有した旅行でも同じです。',
  'help.guide.place-image.tip.1': 'JPG、PNG、GIF、WebP を受け取り、iPhone の HEIC は取り込みの途中で変換されます。',
  'help.guide.place-image.tip.2':
    '角の X であなたの写真をまた外すと、自動の写真が戻ります。場所そのものには手が加わりません。',
  'help.guide.place-image.tip.3':
    '自分の写真がない場合、TREK は場所の座標から写真を探し、見つからなければカテゴリのアイコンに戻ります。',
  // place-day-assign
  'help.guide.place-day-assign.title': '開いている日に場所を置く、または外す',
  'help.guide.place-day-assign.goal': '行をプランナー越しにドラッグする代わりに、カード自身のボタンを使います。',
  'help.guide.place-day-assign.step.1':
    '日程の列で日のヘッダーをクリックします。その日が今の開いている日になり、カードはその日に対して働きます。',
  'help.guide.place-day-assign.step.2':
    '場所の列で、その日にまだない場所をクリックします。カードが開き、一番下の行に「日に追加」が出ます。',
  'help.guide.place-day-assign.step.3':
    '「日に追加」をクリックします。立ち寄り先はその日の最後に入り、ボタンは「この日から削除」に変わります。',
  'help.guide.place-day-assign.step.4':
    '立ち寄り先はその日に入り、リストの最後にあります。上にドラッグして、あるべき位置へ動かしてください。',
  'help.guide.place-day-assign.step.5':
    '「この日から削除」はその立ち寄り先をまた日から外し、カードはもう一度「日に追加」を出します。',
  'help.guide.place-day-assign.result':
    'その日は立ち寄り先を持つか、もう持たないかになり、どちらでも場所そのものには手が加わりません。',
  'help.guide.place-day-assign.tip.1':
    'このボタンは日が開いている間しかありません。日がなければ、カードには場所を追加する先がありません。',
  'help.guide.place-day-assign.tip.2':
    '立ち寄り先を日から外しても、場所は旅行の中にも場所の列にも残ります。どこからも消すのは「削除」です。',
  'help.guide.place-day-assign.tip.3':
    '宿泊の予約が日に置いた立ち寄り先には、どちらのボタンも出ません。その泊は日の「宿泊先」の枠で追加し、削除します。',
  // place-participants
  'help.guide.place-participants.title': 'この立ち寄り先に誰が行くかを決める',
  'help.guide.place-participants.goal': '旅行を分けずに、1つの立ち寄り先だけグループを分けます。',
  'help.guide.place-participants.step.1':
    '日の中の立ち寄り先をクリックします。カードが開き、「参加者」に旅行の全員が並びます。',
  'help.guide.place-participants.step.2':
    '旅行者のチップをクリックすると、その人をこの立ち寄り先から外します。名前はマウスを乗せると取り消し線が付きます。',
  'help.guide.place-participants.step.3':
    '誰かが抜けるとすぐに破線の + が現れます。クリックすると、立ち寄り先にいない人が見えます。',
  'help.guide.place-participants.step.4':
    '名前をクリックすると戻せます。全員が戻ると、立ち寄り先はまたグループ全員のものになります。',
  'help.guide.place-participants.result':
    '立ち寄り先はあなたが選んだ旅行者を持ち、残りのグループはその午後を自分たちのために使えます。',
  'help.guide.place-participants.tip.1':
    '「参加者」は立ち寄り先が選ばれているときにしか出ないので、場所の列ではなく日の中で場所を選んでください。旅行者が2人以上いる旅行でのみ出ます。',
  'help.guide.place-participants.tip.2':
    '誰も選ばないことは、全員が行くという意味です。だからこそ、立ち寄り先に最後に残った1人を外すことはできません。',
  'help.guide.place-participants.tip.3':
    '自分のアカウントを持たない「ゲスト」も、ほかの人と同じように参加者になれます。',
  // place-booking
  'help.guide.place-booking.title': '立ち寄り先に付いた予約',
  'help.guide.place-booking.goal': '立ち寄り先に属する予約を読み、開き、新しい予約を留めます。',
  'help.guide.place-booking.step.1':
    '予約が属する立ち寄り先を開きます。カードには「確定」または「保留」と予約の名前が入った帯が出ます。',
  'help.guide.place-booking.step.2': '帯には「日付」「時間」「予約コード」と、予約が持つメモが載ります。',
  'help.guide.place-booking.step.3': '帯をクリックします。その予約自身のフォームが上に開きます。',
  'help.guide.place-booking.step.4':
    '「日への割り当てにリンク」が予約を立ち寄り先に留めるもので、ここではすでにこの立ち寄り先の名前が入っています。フォームをまた閉じます。',
  'help.guide.place-booking.step.5':
    '立ち寄り先の新しい予約は日程の列から始めます。立ち寄り先にマウスを乗せ、その末尾の + をクリックします。フォームは「新しい予約」として開き、すでにその立ち寄り先にリンクされています。',
  'help.guide.place-booking.result':
    '予約は立ち寄り先にぶら下がります。カードにも、日の中にもあり、そのファイルはここの「ファイル」にも一覧されます。',
  'help.guide.place-booking.tip.1':
    '帯は予約が留められている立ち寄り先にしか出ません。立ち寄り先のない予約は「予約」タブにあります。',
  'help.guide.place-booking.tip.2':
    '1つの立ち寄り先を複数の予約が共有できます。昼食と、同じ扉から始まるツアーのように。',
  'help.guide.place-booking.tip.3':
    '列車、フライト、フェリーは代わりに交通のフォームを開きます。「移動」タブが使うフォームです。',
  // place-files
  'help.guide.place-files.title': '場所のチケットを場所と一緒に置く',
  'help.guide.place-files.goal': '場所のチケット、バウチャー、地図を、あとで探す場所に置きます。',
  'help.guide.place-files.step.1':
    '場所を開きます。「ファイル」はカードの足元にあり、場所に1つもない間は「ファイル」と表示されます。',
  'help.guide.place-files.step.2': 'その横の「アップロード」をクリックしてファイルを選びます。',
  'help.guide.place-files.step.3': 'ボタンは場所が持っている数を数え、一覧はひとりでに開きます。',
  'help.guide.place-files.step.4': '各行はファイルの名前とサイズです。クリックするとファイルが開きます。',
  'help.guide.place-files.result': 'ファイルは場所に付き、カードで数えられ、旅行の「ファイル」タブにも出ます。',
  'help.guide.place-files.tip.1':
    '「ファイル」はこの立ち寄り先の予約にぶら下がっているものも一覧するので、ホテルの確認書はホテルに出ます。',
  'help.guide.place-files.tip.2': '「アップロード」は複数のファイルを一度に受け取ります。',
  'help.guide.place-files.tip.3':
    '「ファイルをアップロード」の権限がないと「アップロード」ボタンは出ません。すでに場所にあるファイルはそのままです。',
  // place-navigation
  'help.guide.place-navigation.title': '場所を地図アプリやWebサイトで開く',
  'help.guide.place-navigation.goal': '実際にそこへ連れて行ってくれるアプリに場所を渡します。',
  'help.guide.place-navigation.step.1': '場所を開き、一番下の行の「ナビゲーション」をクリックします。',
  'help.guide.place-navigation.step.2':
    '一覧はこの場所に合う地図アプリです。Google Maps、Waze、Apple Maps、OpenStreetMap、CoMaps。',
  'help.guide.place-navigation.step.3':
    '使っているものをクリックします。TREK はできるところでは座標の組だけでなく場所そのものを渡すので、正しい入口に着きます。',
  'help.guide.place-navigation.step.4':
    'その隣の「Webサイトを開く」は、場所自身のページ、その時間とチケットを新しいタブで開きます。',
  'help.guide.place-navigation.result':
    '地図アプリが場所を開き、Webサイトは別のタブで開き、旅行の中は何も変わりません。',
  'help.guide.place-navigation.tip.1':
    'Waze はすぐに案内を始めます。ほかは場所を開くので、そこから出発するにはもう1タップ必要です。',
  'help.guide.place-navigation.tip.2':
    'どのアプリが出るかは場所とあなたの端末によります。Android では Apple Maps は外れ、高德地图 は中国の場所でしか出ず、Waze、Apple Maps、CoMaps は場所の座標を必要とします。',
  'help.guide.place-navigation.tip.3':
    '当てはまるアプリが1つだけのときは、ボタンがそのアプリの名前になり、すぐにそれを開きます。',
  // place-to-collection
  'help.guide.place-to-collection.title': '場所を自分のリストの1つに保存する',
  'help.guide.place-to-collection.goal': 'この旅行で見つけた場所を、次の旅行のために取っておきます。',
  'help.guide.place-to-collection.step.1': '場所を開き、カードの下の「コレクションに保存」をクリックします。',
  'help.guide.place-to-collection.step.2':
    '「リストに保存」は、あなたが持っているリストと共有されているリストをすべて見せます。すでにこの場所が入っているものにはチェックが付きます。',
  'help.guide.place-to-collection.step.3': 'リストをクリックします。場所はすぐにその中に入ります。',
  'help.guide.place-to-collection.step.4': '閉じると、カードのボタンは「保存済み」になります。',
  'help.guide.place-to-collection.result':
    '場所は写真とメモと住所を持ったままあなたのリストに入り、次の旅行に備えます。',
  'help.guide.place-to-collection.tip.1':
    'このボタンは「コレクション」アドオンが有効な間だけあります。管理者が「アドオン」の下で有効にします。',
  'help.guide.place-to-collection.tip.2':
    '1つの場所が同時に複数のリストに入ることができ、それぞれで状態を持てます。あるリストでは「アイデア」、別のリストでは「訪問済み」のように。',
  'help.guide.place-to-collection.tip.3':
    'ピッカーの場所の名前の横にある「訪問済みにする」は、そのリストでその場所にチェックを付けます。場所があなたのリストのいくつかに入っている場合、そのピルは「すべてで訪問済み」となり、一度にすべてを処理します。',
  // place-track
  'help.guide.place-track.title': 'トラックを読み、独自の色を与える',
  'help.guide.place-track.goal': 'インポートした歩きの長さを見て、その線を地図のほかの線と見分けます。',
  'help.guide.place-track.step.1':
    '場所の列のトラックの行には、その線が描かれる色の短い線が付いています。クリックします。',
  'help.guide.place-track.step.2': '「統計を記録」は、設定した「距離単位」で道の長さを示します。',
  'help.guide.place-track.step.3':
    'その上の「トラックの色」が使っている色を見せます。行をクリックすると見本が開きます。',
  'help.guide.place-track.step.4': '色を選びます。地図の線と行の短い線が一緒に変わります。',
  'help.guide.place-track.step.5':
    '左の破線のマス、「自動の色」は、トラックに受け継ぐ色を返します。右のスポイト、「カスタムカラーを選択」は、それ以外の色のためにシステムのカラーピッカーを開きます。',
  'help.guide.place-track.result': 'トラックは選んだ色で、カードでも、場所の列のその行でも、地図でも描かれます。',
  'help.guide.place-track.tip.1':
    'この2つの枠を持つのは、GPX、KML、KMZ ファイルからインポートした道を持つ場所だけです。',
  'help.guide.place-track.tip.2':
    '高度付きで記録されたトラックは、最高地点と最低地点、上りと下りのメートル数、歩きのプロファイルも見せます。',
  'help.guide.place-track.tip.3':
    'インポートは取り込むトラック1つ1つに固有の色を与えるので、2つの歩きが同じ色で入ってくることはありません。',
  // read-place
  'help.guide.read-place.step.7':
    '一番下の行はここからできることです。開いている日から場所を外す、または置く、リストに保存する、地図アプリで開く、編集する、削除する。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'ファイル',
  'help.ctx.trip-files.summary':
    '旅行のすべての書類が1つのリストに並びます。チケット、予約確認、パス、写真。それぞれにメモと、属する場所や予約へのリンクが付き、ゴミ箱に入れても戻せます。',
  'help.ctx.trip-files.bullet.1':
    '上の「ここにファイルをドロップ」がファイルを受け取ります。ボックスをクリックするとファイル選択が開きます。その下の行には、この TREK が受け取るファイル形式と、1ファイル 50 MB の上限が並びます。',
  'help.ctx.trip-files.bullet.2':
    'タブはリストに何を出すかを決めます。「すべて」「PDF」「画像」「ドキュメント」で、それぞれに件数が付きます。ファイルにスターを付けるとスターのタブが、メモに添付が付くと「Collabメモ」が加わります。',
  'help.ctx.trip-files.bullet.3':
    '行にはアップロードした人、名前、その下のメモ、サイズと日付、そしてリンクごとに1つのバッジが出ます。「日別計画」と場所、「予約」または「移動」と予約、「Collabメモより」です。',
  'help.ctx.trip-files.bullet.4':
    '行の末尾には「スター」「割り当て」「開く」「ダウンロード」「削除」があります。「削除」は確認しません。ファイルはゴミ箱に入り、そこから戻せます。',
  'help.ctx.trip-files.bullet.5':
    '写真や動画は全画面で開き、矢印キーとサムネイルの列で動かせます。それ以外の書類はページの上のプレビューで開き、「新しいタブで開く」と「ダウンロード」が付きます。ウォレットのパスはそのままダウンロードされます。',
  'help.ctx.trip-files.bullet.6':
    '右端の「ゴミ箱」はリストを削除済みのファイルに切り替えます。そこで1つずつ復元するか完全に削除でき、「ゴミ箱を空にする」はすべてを消します。管理者がドキュメントの保管先をつないでいるところでは、その隣に「ドキュメント同期」が出ます。',
  // files-upload
  'help.guide.files-upload.title': '書類を旅行に入れる',
  'help.guide.files-upload.goal':
    'チケットや予約確認、写真をダウンロードフォルダーから旅行に移し、旅行の全員が手に取れるようにします。',
  'help.guide.files-upload.step.1':
    '旅行を開き、タブバーの「ファイル」をクリックします。旅行の書類がそこに並び、その上にアップロードのボックスがあります。',
  'help.guide.files-upload.step.2':
    '「ここにファイルをドロップ」をクリックし、1つまたは複数のファイルを選びます。ファイルは順にアップロードされ、その間ボックスには「アップロード中...」と出ます。ボックスの下の行は、この TREK が受け取る形式と、1ファイルが最大 50 MB であることを伝えます。',
  'help.guide.files-upload.step.3':
    '最後のファイルが上がると、そのファイルの「ファイルを割り当て」がひとりでに開きます。「メモを追加...」はファイルに1行を与え、その下のリストはファイルを場所や予約に結び付けます。× で閉じます。閉じても失われるものはありません。',
  'help.guide.files-upload.step.4':
    '新しいファイルはリストの先頭に並びます。行にはアップロードした人、名前、サイズ、日付が出ます。写真にはサムネイルが、それ以外のファイルにはその形式が付きます。',
  'help.guide.files-upload.result': '書類は旅行の中にあり、旅行を見られる全員が開いてダウンロードできます。',
  'help.guide.files-upload.tip.1':
    'ファイルはデスクトップからボックスへ直接ドラッグすることもできます。ファイルが上にある間、ボックスは明るくなります。',
  'help.guide.files-upload.tip.2':
    'クリップボードの画像は Ctrl+V でリストに入ります。予約のスクリーンショットを先に保存する必要はありません。',
  'help.guide.files-upload.tip.3':
    'アップロードには「ファイルをアップロード」の権限が要ります。権限がなければボックス自体が出ません。一覧にない形式はメッセージとともに拒まれ、何もアップロードされません。50 MB を超えるファイルは、何かが送られる前にボックス自身が弾きます。',
  // files-link
  'help.guide.files-link.title': '書類を場所や予約に結び付ける',
  'help.guide.files-link.goal': 'チケットをこのリストからだけでなく、属する日からも見つけられるようにします。',
  'help.guide.files-link.step.1':
    '行の末尾の鉛筆、「割り当て」をクリックします。ファイル名を題にした「ファイルを割り当て」が開きます。',
  'help.guide.files-link.step.2':
    '「メモ」の下の「メモを追加...」は1行を受け取り、その行はリストでファイル名の下に出ます。ボックスから離れた時点で保存されます。',
  'help.guide.files-link.step.3':
    '「場所」の下には旅行の場所が、それぞれの属する日ごとにまとめて並び、どの日にもない場所は末尾の「未割り当て」に入ります。1つをクリックするとチェックが付きます。',
  'help.guide.files-link.step.4':
    '「予約」と「移動」の下には旅行の予約が並びます。書類が属するものをクリックすると、そちらにもチェックが付きます。',
  'help.guide.files-link.step.5': '× で閉じます。ここに保存ボタンはありません。クリックはそのつど書き込まれています。',
  'help.guide.files-link.result':
    '行にはメモと、リンクごとに1つのバッジが付きます。「日別計画」と場所の名前、「移動」と便の名前です。書類はその場所にも、その便にも掛かります。',
  'help.guide.files-link.tip.1':
    '1つのファイルは複数のリンクを同時に持てます。同じ予約確認がホテルにも、それが覆う夜にも属します。',
  'help.guide.files-link.tip.2':
    'チェックの付いた項目をもう一度クリックすると、そのリンクが外れます。ファイル自体は残ります。',
  'help.guide.files-link.tip.3':
    '逆も同じです。場所や予約に添付した書類はこのリストにも出て、その行に同じバッジが付きます。',
  // files-star
  'help.guide.files-star.title': '大事な書類を上に置いておく',
  'help.guide.files-star.goal': '旅行の間ずっと増え続けるリストから、本当に要る2つか3つの書類を引き出します。',
  'help.guide.files-star.step.1':
    '行の末尾の「スター」をクリックします。星が黄色く塗られ、ファイル名の前にもう1つ星が出て、ボタンは「スター解除」になります。',
  'help.guide.files-star.step.2':
    'リストは並べ直されます。スター付きのファイルがほかのすべての上に来て、それぞれのまとまりの中では新しい順に並びます。',
  'help.guide.files-star.step.3':
    '上のタブに星が1つ加わり、その後ろにスター付きファイルの数が出ます。クリックするとそれだけが見えます。',
  'help.guide.files-star.result': 'カウンターで要る書類がリストの先頭に並び、1つのタブにはそれしか出ません。',
  'help.guide.files-star.tip.1':
    '星のタブは何かにスターが付いている間だけあります。最後の1つのスターを外すと、タブも一緒に消えます。',
  'help.guide.files-star.tip.2':
    'スターを付けるのは編集に当たります。「ファイル情報を編集」の権限がなく、旅行のファイルを読むことしかできないメンバーには、星は見えますが付けられません。',
  // files-filter
  'help.guide.files-filter.title': 'リストの中から書類を見つける',
  'help.guide.files-filter.goal': 'すべてが入ったリストを、探している1種類の書類まで絞り込みます。',
  'help.guide.files-filter.step.1':
    'リストの上のタブは「すべて」「PDF」「画像」「ドキュメント」で、それぞれの後ろにファイル数が出ます。',
  'help.guide.files-filter.step.2': '「PDF」をクリックします。リストには PDF ファイルだけが残ります。',
  'help.guide.files-filter.step.3':
    'さらに2つのタブが、旅行の中身に応じて出たり消えたりします。Collab タブのメモに添付が付くとすぐ現れる「Collabメモ」をクリックします。一覧にはそれらのファイルだけが残ります。星も同じように、ファイルにスターが付くとすぐ列に加わります。',
  'help.guide.files-filter.step.4': '「すべて」でリスト全体が戻ります。',
  'help.guide.files-filter.result': 'リストにはタブが示すものだけが出て、各タブの数字がその件数を伝えます。',
  'help.guide.files-filter.tip.1':
    'ここにはフォルダーも名前の変更もありません。「ファイルを割り当て」のメモ、場所や予約へのリンク、そしてスターが、書類を整理する手立てです。',
  'help.guide.files-filter.tip.2':
    'リスト自体は常にスター付きが先、次に新しい順です。今日アップロードした書類は先月のものより上に来ます。',
  // files-preview
  'help.guide.files-preview.title': 'TREK を離れずに書類を読む',
  'help.guide.files-preview.goal': 'チケットや写真をその場で見て、手元の機械に要るときはそこへ取り込みます。',
  'help.guide.files-preview.step.1':
    '写真の名前かサムネイルをクリックします。全画面で開き、ヘッダーにファイル名と、写真の中での位置が出ます。',
  'help.guide.files-preview.step.2':
    '両側の丸い矢印、左右の矢印キー、下のサムネイルの列で、リストが今出しているすべての写真を送れます。',
  'help.guide.files-preview.step.3':
    'ヘッダーには「新しいタブで開く」と「ダウンロード」があります。× か Escape で写真はまた閉じます。',
  'help.guide.files-preview.step.4':
    '写真でない書類は、代わりにページの上のプレビューで開き、ヘッダーには同じ2つのボタンが出ます。こちらは × か、横のクリックで閉じます。',
  'help.guide.files-preview.step.5':
    '行の末尾の「ダウンロード」は、何も開かずにファイルをそのまま手元の機械に保存します。',
  'help.guide.files-preview.result':
    '書類は画面に出ており、同じ2つのボタンがそれをブラウザーのタブか、ディスクに置きます。',
  'help.guide.files-preview.tip.1': 'タッチ画面では、矢印をクリックする代わりにスワイプで写真を送ります。',
  'help.guide.files-preview.tip.2':
    'ウォレットのパスはプレビューを開きません。すぐにダウンロードされ、スマートフォンがウォレットのアプリに渡せるようになります。',
  'help.guide.files-preview.tip.3':
    '「新しいタブで開く」と「ダウンロード」は、どちらもあなたのセッションでファイルを取ってきます。アドレスバーからコピーしたリンクは、ほかの人には役に立ちません。',
  // files-trash
  'help.guide.files-trash.title': '書類を捨てて、また取り戻す',
  'help.guide.files-trash.goal': '旅行にもう要らないものを片づけます。やはり要ったものを失うことはありません。',
  'help.guide.files-trash.step.1':
    '行の末尾の「削除」をクリックします。ファイルはすぐリストから消え、「ゴミ箱に移動しました」と出ます。先に確認は入りません。',
  'help.guide.files-trash.step.2':
    'ツールバーの右端の「ゴミ箱」は、リストを捨てたものに切り替えます。見出しは「ゴミ箱」になり、フィルターのタブは消えます。',
  'help.guide.files-trash.step.3':
    '捨てられた行は灰色になり、ボタンは2つだけ残ります。ファイルを戻す「復元」と、確認のあと完全に消す「削除」です。',
  'help.guide.files-trash.step.4':
    '「復元」をクリックします。「ファイルを復元しました」と出て、行はメモとリンクを付けたままゴミ箱から出ます。',
  'help.guide.files-trash.step.5':
    '上の「ゴミ箱を空にする」は、ここに残っているものをすべて完全に消します。その前にブラウザーが一度たずねます。「ゴミ箱」でファイルの一覧に戻ります。',
  'help.guide.files-trash.result': 'ファイルは元のとおりリストに戻り、何もなかったかのようです。',
  'help.guide.files-trash.tip.1':
    '行の「削除」は先にたずねません。そのためのゴミ箱です。ここであなたが言うまで、TREK から出ていくものはありません。',
  'help.guide.files-trash.tip.2':
    'ファイルを捨てることも戻すことも、「ファイルを削除」の権限が要ります。権限のないメンバーには、行の「削除」もゴミ箱の中のボタンも出ません。',
  'help.guide.files-trash.tip.3': 'ゴミ箱で完全に削除したファイルは戻せません。',
  // files-sync
  'help.guide.files-sync.title': 'ドキュメントを自分のドキュメント保管先と同期し続ける',
  'help.guide.files-sync.goal':
    '旅行を自分のドキュメント保管先に結び付け、ここでアップロードしたものが向こうに届き、向こうで整理したものがここに現れるようにします。',
  'help.guide.files-sync.step.1':
    'ツールバーの右端、「ゴミ箱」の隣の「ドキュメント同期」をクリックします。ダイアログがタイトルの下に旅行の名前を付けて開きます。左の「連携先を接続」の下には管理者がオンにした保管先が並び、それぞれに整理の仕方の1行が付きます。Paperless-ngx と Papra はタグで、Nextcloud と Synology Drive はフォルダーで、OpenCloud はスペースで整理します。右には「まだ何も接続されていません」と読めます。',
  'help.guide.files-sync.step.2':
    '自分の保管先をクリックします。ここでは Nextcloud です。接続のための小さなダイアログが保管先の名前で開き、その保管先がサインインに使う情報を求めます。',
  'help.guide.files-sync.step.3':
    '「アドレス」と、保管先ごとのサインイン情報を入力します。Paperless-ngx なら「API トークン」、Papra なら「API キー」と「組織 ID」、Nextcloud なら「ユーザー名」と「アプリパスワード」、OpenCloud なら「ユーザー名」と「アプリトークン」、Synology Drive なら「ユーザー名」、「パスワード」、そしてアカウントが求める場合は「二段階認証コード」です。保管先がアプリパスワードやトークンを用意しているなら必ずそれを使い、アカウントのパスワードは決して使わないでください。Nextcloud と Synology Drive は任意の「基準フォルダー」も受け付けます。TREK が旅行用フォルダーを探す場所で、ここでは /Reisen です。一番下の「自己署名証明書を許可」は、そのような証明書を持つ自分のネットワーク上の保管先のためだけのものです。',
  'help.guide.files-sync.step.4':
    '「接続をテスト」をクリックします。TREK は入力した内容で保管先に到達し、フッターは「接続できました。」に続けて、アカウント名を入れた「… としてサインインしています」と読めます。拒否された認証情報や到達できないアドレスは代わりにそこに示され、どちらの場合も何も保存されません。',
  'help.guide.files-sync.step.5':
    '「接続」をクリックします。接続は旅行とともに保存され、TREK は旅行を保管先のどこに置くか、つまりドキュメントを収めるタグ、フォルダー、スペースを尋ねます。同期されるのはその中身だけです。「新しく作る」は「作成」でそれを作り、名前は旅行のタイトルからあらかじめ入っています。「または既にあるものを使う」の下にはすでにあるものが並びます。1つをクリックします。ここではフォルダー Autumn in Japan です。',
  'help.guide.files-sync.step.6':
    'ダイアログが戻ってきます。左の「この旅行」の下に自分の保管先があり、右のそのカードには同期先、最後に実行した時刻、「今すぐ同期」があります。最初の実行はひとりでに始まり、「今すぐ同期」はいつでも1回実行します。1回の実行が終わると、名前の隣の「まだ同期していません」のバッジは緑の点に変わり、ポインターを重ねると「同期済み」と読めます。フローバーは TREK と保管先がそれぞれ持つドキュメントを数え、その間に「保管先へ」と「保管先から」のレーンがあります。× でダイアログを閉じます。',
  'help.guide.files-sync.result':
    '保管先にすでにあったドキュメントが、あなたの名前でアップロードされたものとしてリストの先頭に並び、旅行のすべてのドキュメントも保管先にあります。以後、TREK は背後で保管先を確認し、保管先はリストに従います。',
  'help.guide.files-sync.tip.1':
    '旅行を結び付けられるのは旅行のオーナーかインスタンスの管理者だけです。認証情報が保管先のそのアカウント全体に及ぶからです。メンバーは誰でも「ドキュメント同期」を開き、カードを読み、「今すぐ同期」を押せます。',
  'help.guide.files-sync.tip.2':
    '自分のネットワーク上の保管先には、TREK サーバーに ALLOW_INTERNAL_NETWORK=true が必要で、そのアドレスはネットワーク上のそのマシンのアドレスでなければならず、localhost は使えません。それがないと、「接続をテスト」は「このアドレスは許可されていません。」と答えます。',
  'help.guide.files-sync.tip.3':
    'カードの「接続解除」は結び付きを終え、両側のすべてのドキュメントを保ちます。二度目に結び付けたタグ、フォルダー、スペースは新しいものとして扱われ、中身がすべてもう一度入ってくるので、「接続解除」のあとは古いものではなく空のものを結び付けてください。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日詳細',
  'help.ctx.trip-day-detail.summary':
    '日のヘッダーが地図の上に開くパネルです。その日の全体、名前と日付、行き先の天気、その日にかかる予約、そしてその日に取った宿泊が並びます。',
  'help.ctx.trip-day-detail.bullet.1':
    '日程の列で日のヘッダーをクリックすると、パネルが地図の中央の上に開きます。同じヘッダーをもう一度、またはその右端の X をクリックすると閉じ、日の選択も外れます。',
  'help.ctx.trip-day-detail.bullet.2':
    'ヘッダーにはその日の名前と日付が出ます。名前の隣の鉛筆で日の名前を変えられ、二重シェブロンはパネルを細いバーに折りたたんで地図をまた空けます。',
  'help.ctx.trip-day-detail.bullet.3':
    'いちばん上はその日の天気です。「…の予報」がどの場所のものかを示します。その日の最初の立ち寄り先か、朝を迎えるホテルです。',
  'help.ctx.trip-day-detail.bullet.4':
    '「予約」はその日の予約を、種類、属する立ち寄り先、時刻とともに並べます。緑は確定、琥珀色はまだ保留です。ここは読むだけで、予約を変えるのは「予約」タブです。',
  'help.ctx.trip-day-detail.bullet.5':
    '「宿泊先」はこの日にかかるすべての宿泊を出します。「チェックイン」と「チェックアウト」はそれぞれの日に付き、チェックインの受付時間帯、チェックアウトの時刻、確認番号も出ます。',
  'help.ctx.trip-day-detail.bullet.6':
    '「宿泊先を追加」はこの日に宿泊を取ります。旅行の場所から宿を選び、どの日にかかるかを決め、時刻とコードを入れます。',
  // day-panel
  'help.guide.day-panel.title': '日を開いて詳細を読む',
  'help.guide.day-panel.goal': '地図から離れずに、1日の全体、天気、予約、そして泊まる場所を見ます。',
  'help.guide.day-panel.step.1':
    '日程の列で日のヘッダーをクリックします。その日が選ばれ、詳細が地図の中央の上に開きます。',
  'help.guide.day-panel.step.2':
    'ヘッダーはその日の名前を出します。名前を付けるまでは「1日目」で、その下に日付が出ます。',
  'help.guide.day-panel.step.3':
    'いちばん上はその日の天気です。「…の予報」がどの場所のものかを伝えます。その日の最初の立ち寄り先か、朝を迎えるホテルです。',
  'help.guide.day-panel.step.4': 'その下の「予約」は、この日にかかる予約を時刻とともに並べます。',
  'help.guide.day-panel.step.5':
    '「宿泊先」はこの日にかかる宿泊を出し、「チェックイン」と「チェックアウト」はそれぞれの日に付きます。',
  'help.guide.day-panel.step.6':
    'ヘッダーの二重シェブロンはパネルを細いバーに折りたたみます。その隣の X はパネルを閉じ、日の選択も外します。',
  'help.guide.day-panel.result':
    'バーに折りたたまれたパネルは地図を空けたまま、日の選択を保ちます。閉じると日の選択が外れ、計画は元のままです。',
  'help.guide.day-panel.tip.1':
    'パネルのヘッダーバーはどこをクリックしても折りたためます。シェブロンはそのためのボタンにすぎません。',
  'help.guide.day-panel.tip.2':
    '場所の列から場所を開くと、パネルの位置に場所の詳細が入ります。詳細を閉じれば日が戻ります。',
  // day-weather
  'help.guide.day-weather.title': 'その日の天気を読む',
  'help.guide.day-weather.goal': 'その日に実際にいる場所で、1日がどうなるかを知ります。',
  'help.guide.day-weather.step.1':
    '「…の予報」が、数値がどの場所のものかを示します。その日の最初の立ち寄り先、立ち寄り先のない日は朝を迎えるホテルです。',
  'help.guide.day-weather.step.2': '大きい数字がその日の気温で、その隣に最低と最高、そして天気の状態が言葉で出ます。',
  'help.guide.day-weather.step.3': 'その下のチップは、降水確率、降水量、いちばん強い風、日の出と日の入りです。',
  'help.guide.day-weather.step.4':
    'いちばん下はその日の1時間ごと、2時間おきです。時刻、アイコン、気温、降水確率が出ます。50% を超える時間は青く塗られます。',
  'help.guide.day-weather.result':
    '日程の列にあるその日のカードにも、番号の下に同じ天気が小さく出るので、旅行全体をひと目で読めます。',
  'help.guide.day-weather.tip.1':
    '気温と風は、設定の「表示」にある「温度単位」に従います。「°F Fahrenheit」を選ぶと、同じ予報が °F と mph で読み出されます。',
  'help.guide.day-weather.tip.2':
    '座標のある立ち寄り先も、朝を迎えるホテルもない日は、天気がまったく出ません。予報はいつも場所に対するもので、旅行に対するものではありません。',
  'help.guide.day-weather.tip.3':
    '16 日より先の予報はそもそもありません。そのときの数値はその日付の過去の年の平均で、Ø が付き、その下にそう書かれます。',
  // rename-day
  'help.guide.rename-day.title': '日に名前を付ける',
  'help.guide.rename-day.goal':
    '「5日目」ではなく、「Kyoto 到着」や「休息日」のように、その日をそのままの名前で呼びます。',
  'help.guide.rename-day.step.1': '日を開きます。ヘッダーは「5日目」と出ていて、その下に日付があります。',
  'help.guide.rename-day.step.2': '名前の隣の鉛筆をクリックします。',
  'help.guide.rename-day.step.3': '名前が入力欄になります。付けたい名前を入力します。',
  'help.guide.rename-day.step.4':
    'Enter を押すか、ほかの場所をクリックするだけでも保存されます。Escape は変更を捨てます。日程の列のその日のカードにも名前が出ます。',
  'help.guide.rename-day.result': '名前はパネルと日程の列のカードで「5日目」に代わります。日付はそのままです。',
  'help.guide.rename-day.tip.1':
    '入力欄を空にして保存すると、その日はまた「5日目」になります。名前がないときに出るのが番号です。',
  'help.guide.rename-day.tip.2':
    '名前は日付ではなく日に属します。日を並べ替えると、その日のほかのものと一緒に移ります。',
  // add-accommodation
  'help.guide.add-accommodation.title': '日に宿泊を取る',
  'help.guide.add-accommodation.goal': 'ホテルを一度だけ計画に入れます。かかる日、時刻、確認番号もまとめて入れます。',
  'help.guide.add-accommodation.step.1':
    '宿はまず旅行の場所である必要があります。ほかの場所と同じように場所の列で作ってください。選択画面には、すでにあるものしか出ません。',
  'help.guide.add-accommodation.step.2': '到着する日を開き、「宿泊先」の下の「宿泊先を追加」をクリックします。',
  'help.guide.add-accommodation.step.3':
    '「適用日」がその宿泊のかかる夜を決めます。左がチェックインの日、右がチェックアウトの日です。「すべて」は旅行全体にかかります。',
  'help.guide.add-accommodation.step.4':
    '「チェックイン」「チェックイン期限」「チェックアウト」を入れ、予約番号を「確認」に入れます。4つとも空のままでも構いません。',
  'help.guide.add-accommodation.step.5': '旅行の場所から宿を選びます。リストの上のチップで1つのカテゴリーに絞れます。',
  'help.guide.add-accommodation.step.6': '「保存」をクリックします。',
  'help.guide.add-accommodation.result':
    '宿泊はかかるすべての日に出ます。最初の日に「チェックイン」、最後の日に「チェックアウト」です。宿はチェックインの日の立ち寄り先になるので地図がそこまでの道を描き、「予約」タブに「宿泊」の予約が現れます。',
  'help.guide.add-accommodation.tip.1':
    '選択画面は開いた日で始まり、チェックアウトはその翌日になります。保存する前にどちらも動かせます。',
  'help.guide.add-accommodation.tip.2':
    'ホテルを作るときに旅行のカテゴリー Hotel を付けておくと、リストの上のチップで1クリックでホテルだけに絞れます。',
  'help.guide.add-accommodation.tip.3':
    '時刻はすべて任意です。チェックインもコードもない宿泊でも、夜はちゃんとかかり、ルートも描かれます。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '取った宿泊を変える、または取り消す',
  'help.guide.edit-accommodation.goal': '宿泊を動かす、時刻を直す、あるいは計画から外します。',
  'help.guide.edit-accommodation.step.1':
    '宿泊のどの日でも、カードには宿、チェックインの受付時間帯、チェックアウトの時刻、確認番号が出ます。',
  'help.guide.edit-accommodation.step.2':
    'その右の鉛筆で宿泊がもう一度開きます。ポップアップの表示は「宿泊先を編集」に変わります。',
  'help.guide.edit-accommodation.step.3':
    '並んだ項目を直します。「チェックイン」「チェックイン期限」「チェックアウト」「確認」です。その上のかかる日と、その下の宿そのものも、ここで変えられます。',
  'help.guide.edit-accommodation.step.4': '「保存」をクリックします。',
  'help.guide.edit-accommodation.step.5':
    '鉛筆の隣の X は宿泊を終わらせます。確認は出ず、それに属する「宿泊」の予約も一緒になくなります。',
  'help.guide.edit-accommodation.result':
    '変更は宿泊のかかるすべての日に一度に届き、「予約」タブの「宿泊」の予約にも届きます。',
  'help.guide.edit-accommodation.tip.1':
    '宿泊の途中の夜には「チェックイン」も「チェックアウト」もラベルが付きません。付くのは期間の最初の日と最後の日だけです。',
  'help.guide.edit-accommodation.tip.2':
    '宿泊を取り消すと、チェックインの日に置かれた立ち寄り先と、その予約に付いた費用も一緒になくなります。間違いだったときは、もう一度宿泊を取ってください。',
  // day-bookings
  'help.guide.day-bookings.title': 'その日の予約をひと目で',
  'help.guide.day-bookings.goal': 'この日に何がすでに予約されていて、確定しているかどうかを、1か所で見ます。',
  'help.guide.day-bookings.step.1':
    '「予約」はその日の予約を並べます。その日の日付が付いたものと、その日の立ち寄り先にぶら下がったものです。',
  'help.guide.day-bookings.step.2':
    '行には予約の種類と名前が出て、立ち寄り先に属するものはその立ち寄り先が中黒のあとに続きます。時刻は右端です。',
  'help.guide.day-bookings.step.3':
    '色が予約の状態を示します。緑の行は確定、琥珀色はまだ保留です。ホテルはこのリストには出ず、下に自分のブロックを持ちます。',
  'help.guide.day-bookings.step.4':
    'このリストは予約を読み出すだけです。予約を作ったり変えたりするのは「予約」タブです。',
  'help.guide.day-bookings.result':
    'その日の日付が付いたものも、その日の立ち寄り先にぶら下がったものも、すべてこの1つのリストに入ります。',
  'help.guide.day-bookings.tip.1':
    '予約は自分の日付でその日に乗ります。「予約」タブで日付を変えれば、ひとりでにもう一方の日へ移ります。',
  'help.guide.day-bookings.tip.2':
    '「予約」のブロックがなければ、その日に予約はありません。空で出すのではなく隠されます。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '地図',
  'help.ctx.trip-map.summary':
    '計画の中央です。旅行のすべての場所がピンとして並び、それらをつなぐルートがあり、地図の縁には衛星表示、旅程全体の一括表示、いま見ている街の一帯の場所を探すためのスイッチがあります。',
  'help.ctx.trip-map.bullet.1':
    'ピンは場所です。写真があればその写真、なければカテゴリの色とカテゴリのアイコンになります。ポインターを重ねると、名前と住所を載せたカードが出て、場所が持っていればカテゴリと評価も出ます。ピンを日のカードにドラッグすると、その日にその場所を計画できます。',
  'help.ctx.trip-map.bullet.2':
    '近すぎて見分けられないピンは、件数を持つ1つの濃い色のバブルにまとまります。バブルをクリックすると、地図はその中身に合わせて拡大します。',
  'help.ctx.trip-map.bullet.3':
    'ピンをクリックすると地図の下にその場所が開き、評価、「ファイル」、次にできることが出ます。地図の何もないところをクリックすると、また閉じます。',
  'help.ctx.trip-map.bullet.4':
    '日程の列で日が開いていると、その立ち寄り先には小さな白いバッジが付き、その日の中での番号が入ります。2つの日に計画された場所は、· でつないだ両方の番号を持ちます。',
  'help.ctx.trip-map.bullet.5':
    '上部のアイコンの列は、見えている範囲の地図を検索します。「レストラン」「カフェ」「バー・ナイトライフ」「宿泊施設」「観光スポット」「美術館・文化施設」「自然・公園」「アクティビティ」です。地図を動かしたあとは「このエリアを検索」でもう一度実行します。',
  'help.ctx.trip-map.bullet.6':
    '地図のどこでも右クリックすると、その地点の場所フォームが、住所を調べ終えた状態で開きます。左下の丸いボタンは、描かれた地図を航空写真に入れ替えます。',
  'help.ctx.trip-map.bullet.7':
    '右下の「旅程全体を表示」は、移動のあるすべての日を一度に描き、それぞれが何をたどるかを一覧にします。予約の行のルートアイコンはその予約を描き、日程の上のツールバーにあるアイコンはすべてを描きます。',
  // map-markers
  'help.guide.map-markers.title': '地図を読む',
  'help.guide.map-markers.goal': '地図のピン、バッジ、バブルがそれぞれ何を伝えているかを知ります。',
  'help.guide.map-markers.step.1':
    '地図には旅行のすべての場所があります。ピンが近すぎて見分けられないところでは、中の数を持つ1つの濃い色のバブルにまとまります。バブルをクリックすると、地図は中にあったものに合わせて拡大し、いちばん深いズームではピンを扇のように広げます。',
  'help.guide.map-markers.step.2':
    'ピンは、写真があればその場所自身の写真、なければカテゴリの色とカテゴリのアイコンです。ポインターを重ねると、カードが名前と住所を示し、場所が持っていればカテゴリと評価も示します。',
  'help.guide.map-markers.step.3':
    'ピンをクリックすると、地図の下のカードにその場所が開きます。座標、評価、「ファイル」、そしていちばん下には次にできることが並び、「ナビゲーション」「編集」「削除」などが入ります。日が開いているときは「日に追加」も出ます。地図の何もないところをクリックすると、また閉じます。',
  'help.guide.map-markers.step.4':
    '日程の列で日を開くと、その立ち寄り先に番号が付きます。ピンの角の小さな白いバッジが、その日の中での順番です。2つの日に計画された場所は、· でつないだ両方の番号を持ちます。日が開いていないときは番号はなく、角には代わりに評価が入ります。',
  'help.guide.map-markers.step.5':
    'ピンを地図から日程の列の日のカードへドラッグすると、その場所はその日に計画されます。場所の一覧から行をドラッグするのとまったく同じです。',
  'help.guide.map-markers.result':
    '旅行そのものは何も変わっていません。地図はその眺めであり、それぞれのピンがどの場所、どの日、どの順番かを伝えます。',
  'help.guide.map-markers.tip.1':
    '日程の列で日をたたむと、その立ち寄り先も一緒に地図から消えます。日をまた開けば戻ります。',
  'help.guide.map-markers.tip.2':
    '場所のリストの上のフィルターは、地図が何を描くかも決めます。「未計画」を選ぶと、まだ日の付いていない場所だけが地図に残ります。',
  'help.guide.map-markers.tip.3':
    'この地図にズームボタンはありません。ホイールで拡大縮小し、ダブルクリックで1段階拡大し、地図そのものをドラッグすると動かせます。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '地図で周辺の場所を探す',
  'help.guide.map-nearby-places.goal':
    'いま見ている街の一帯でレストラン、観光スポット、ホテルを地図に探させ、その1つを旅行に取り込みます。',
  'help.guide.map-nearby-places.step.1':
    '地図の上部のアイコンの列がカテゴリ検索です。「レストラン」「カフェ」「バー・ナイトライフ」「宿泊施設」「観光スポット」「美術館・文化施設」「自然・公園」「アクティビティ」があります。',
  'help.guide.map-nearby-places.step.2':
    'カテゴリをクリックします。TREK は見えている範囲の地図でその種類の場所を探し、見つかるごとにそのカテゴリの色のピンを置きます。一度に1つのカテゴリだけです。別のものをクリックすると入れ替わり、オンになっているものをクリックすると解除されます。',
  'help.guide.map-nearby-places.step.3':
    '地図を動かすと、列の下に2つ目のボタンが出ます。「このエリアを検索」が新しい表示範囲で同じ検索を実行します。動かしただけで検索し直すことはなく、そのぶんリクエストの数が抑えられます。',
  'help.guide.map-nearby-places.step.4':
    'ピンには見つかったものの名前が付いています。1つをクリックすると、その内容で埋まった状態で場所フォームが開きます。「名前」「住所」「緯度」「経度」、そして OpenStreetMap にあればウェブサイトと電話番号です。',
  'help.guide.map-nearby-places.step.5':
    '埋まった内容を確かめ、検索には分からなかったことを足します。「説明」、「カテゴリ」、自分の「メモ」です。',
  'help.guide.map-nearby-places.step.6':
    '「追加」をクリックします。同じ名前の場所がすでに旅行にある場合、フォームがそれを伝え、ボタンは「それでも追加」に変わります。',
  'help.guide.map-nearby-places.result':
    '場所は場所のリストにあり、地図では旅行自身のピンの1つになります。日に置かれるまでは「未計画」の下です。検索のピンは、カテゴリをオフにするまで残ります。',
  'help.guide.map-nearby-places.tip.1':
    '「設定」の「Travel & map」で「地図でスポットを探す」がオフのとき、この列はありません。',
  'help.guide.map-nearby-places.tip.2':
    '答えは TREK の場所インデックスと OpenStreetMap から来ます。ですからこれは、計画の中で接続を必要とする数少ないものの1つです。',
  'help.guide.map-nearby-places.tip.3':
    '検索は画面にあるものを対象にします。ですから尋ねたい通りまで拡大してください。街ひとつまるごとでは、最初の60件が、ほとんど順序もなく返ってきます。',
  // map-add-place
  'help.guide.map-add-place.title': '地図を右クリックして場所を作る',
  'help.guide.map-add-place.goal': '先に検索することなく、思ったとおりの位置に場所を置きます。',
  'help.guide.map-add-place.step.1':
    '地図の目的の地点を右クリックします。「場所／アクティビティを追加」という題の場所フォームが開きます。',
  'help.guide.map-add-place.step.2':
    '「緯度」と「経度」はすでにその地点になっており、TREK は座標を調べて、そこで見つかったもので「住所」を埋め、調べた先に名前があれば「名前」も埋めます。まだ何も保存されていないので、違っているところは上書きしてください。',
  'help.guide.map-add-place.step.3':
    '自分で分かる「名前」を付け、計画が知っておくべき残りも入れます。「説明」「メモ」「カテゴリ」「ウェブサイト」です。',
  'help.guide.map-add-place.step.4':
    '「追加」をクリックします。日が開いていても、場所は未計画としてリストに入ります。地図の右クリックが言うのは場所であって、日ではありません。',
  'help.guide.map-add-place.result': '場所はリストと地図にあります。日に置かれるまでは「未計画」の下です。',
  'help.guide.map-add-place.tip.1':
    '住所は座標を引いて得たものなので、名前ではなく通りとして出ることがあり、人里離れた場所では空のまま返ることもあります。どちらの項目も自由に上書きできます。',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL と Mapbox GL の地図では中クリックでも同じことができ、タッチ画面では長押しでできます。',
  // map-satellite
  'help.guide.map-satellite.title': '衛星表示に切り替える',
  'help.guide.map-satellite.goal': '描かれた地図を航空写真に入れ替え、また戻します。',
  'help.guide.map-satellite.step.1':
    '地図の左下の丸いボタンがベースレイヤーの切り替えです。アイコンは常に切り替え先のレイヤーを示し、重ねるとどちらかを伝えます。「衛星表示に切り替える」です。クリックします。',
  'help.guide.map-satellite.step.2':
    '地図は航空写真になりました。建物1つが見分けられるほど詳しく、自分のキーも要りません。TREK が描くものはすべてその上に残ります。ピン、その日のルート、トラック、予約ルートです。',
  'help.guide.map-satellite.step.3':
    'ボタンは「地図表示に切り替える」になりました。クリックすると、描かれた地図に戻ります。',
  'help.guide.map-satellite.result':
    '地図はまた描かれた地図になり、最後に使っていたレイヤーはアカウントに記憶されます。',
  'help.guide.map-satellite.tip.1':
    'この選択は旅行ではなくアカウントに保たれます。ですからどの地図レンダラーを使っていても、どの旅行も最後にしたとおりに開きます。',
  'help.guide.map-satellite.tip.2':
    '航空写真に文字はありません。通りの名前、地区、番地は描かれた地図の側にあるので、住所を探すときは切り替えて戻してください。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '旅程全体とその距離を見る',
  'help.guide.map-whole-trip.goal':
    '開いている1日を、旅行の移動のあるすべての日に入れ替え、それぞれがどれだけ進むかを読み取ります。',
  'help.guide.map-whole-trip.step.1':
    '丸い「旅程全体を表示」ボタンは地図の右下にあります。クリックすると、旅行の移動のあるすべての日が一度に描かれます。それぞれが白い縁取りの上に自分の色で描かれるので、隣り合う日も見分けがつきます。',
  'help.guide.map-whole-trip.step.2':
    'ボタンの上のカードがその日々を並べます。色の点、日の名前、その日の移動手段ごとのアイコン、そしてその日がたどる距離です。いちばん上に「合計距離」があります。',
  'help.guide.map-whole-trip.step.3':
    'カードの中の日をクリックすると選択されます。日程の列で選ぶのと同じです。地図はその日を画面に収め、立ち寄り先には番号が戻ります。',
  'help.guide.map-whole-trip.step.4':
    'ボタンは「旅程全体を非表示」になりました。押すと、開いている1日の表示に戻ります。',
  'help.guide.map-whole-trip.result':
    '移動のあるすべての日がそれぞれの色で描かれ、カードは各日がたどる距離と旅行全体の合計を伝えます。',
  'help.guide.map-whole-trip.tip.1':
    '合計は区間ごとに少しずつ届きます。うしろに … が付いている間、その数はまだ途中までの合計です。すべての区間が答えると確定します。',
  'help.guide.map-whole-trip.tip.2':
    'ルート検索が受け付けなかった区間は直線のままで、距離にも数えられません。カードは黙って少なく見せるのではなく、そのことを伝えます。',
  'help.guide.map-whole-trip.tip.3':
    '位置の分かる立ち寄り先が2つに満たない日は描くルートがないので、カードからはまるごと外れます。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '予約のルートを地図に表示する',
  'help.guide.map-booking-routes.goal': '予約した飛行機、列車、車での移動を地図に描き、また消します。',
  'help.guide.map-booking-routes.step.1':
    '予約ルートは、求めるまではオフです。日程の列の予約の行には小さなルートアイコンがあります。「予約ルートを表示」です。',
  'help.guide.map-booking-routes.step.2':
    'クリックします。予約が地図に出ます。飛行機は大圏の弧、車は実際の道路に沿って、列車は駅を結んだ線です。「確定」は実線、「保留」は破線で描かれ、ルートの両端は移動手段のアイコンが入った青いピルです。',
  'help.guide.map-booking-routes.step.3':
    '端のピルをクリックすると、その裏の予約が時刻、「予約コード」、「場所／住所」とともに開きます。「閉じる」でまたしまえます。',
  'help.guide.map-booking-routes.step.4':
    '日程の上のツールバーにあるルートアイコンは、旅程全体を一度に扱います。「すべての予約ルートを表示」は、ルートを持つすべての予約を描きます。',
  'help.guide.map-booking-routes.step.5':
    'これは上に重ねる層ではなく白紙に戻すものなので、予約ごとに選んだ分は落ちます。「すべての予約ルートを非表示」になったところでもう一度押すと、地図は何もない状態になります。',
  'help.guide.map-booking-routes.result':
    '求めた予約が地図に描かれ、その選択は変えるまで、このブラウザーのこの旅行に保たれます。',
  'help.guide.map-booking-routes.tip.1':
    '両端に空港コードや駅の名前が出るのは、「設定」の「Travel & map」で「予約ルートのラベル」がオンのときだけです。そうでなければアイコンだけが出ます。',
  'help.guide.map-booking-routes.tip.2':
    '同じ設定にある「予約ルートを常に表示」は、まだ決めていないすべての旅行で、最初からルートを描きます。',
  'help.guide.map-booking-routes.tip.3':
    '予約が描かれるには、座標のある両端が必要です。ですからホテルやレストランにはルートアイコンがありません。',
  'help.ctx.trip-map.bullet.8':
    'Dawarich アドオンがオンだと、「旅程全体を表示」の下の丸い Dawarich ボタンが、スマートフォンが実際に記録したルートを描きます。「記録されたルートを表示」は計画したルートの下に日ごとに1色の破線で敷き、線がないときはボタンのラベルがその理由を伝えます。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '実際に移動したルートを表示する',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich がスマートフォンで記録したルートを、計画したルートの隣に破線で地図に重ね、旅行を実際の経過のとおりに日ごとに読みます。',
  'help.guide.map-dawarich-trail.step.1':
    '丸い Dawarich ボタンは地図の右下、「旅程全体を表示」の下にあります。ポインターを重ねると「記録されたルートを表示」と読めます。クリックします。TREK はあなたの Dawarich に旅行の日付を問い合わせ、答えが届くまでボタンのまわりでリングが回ります。',
  'help.guide.map-dawarich-trail.step.2':
    '記録されたルートは日ごとに1色の破線として現れ、計画が読めるように計画したルートの下に描かれます。ボタンはいま「記録されたルートを非表示」と読めます。日は現地の深夜で区切られ、日程の列で畳んだ日は、立ち寄り先とともにその破線も地図から外します。',
  'help.guide.map-dawarich-trail.step.3':
    '「旅程全体を表示」もクリックすると、計画したすべての日が破線の記録の隣に実線で描かれます。両方が重なって走るところは計画どおりに進んだ日で、破線が離れていくところはそうでなかったところです。',
  'help.guide.map-dawarich-trail.result':
    '計画したものと実際にしたことが、破線と実線で一緒に地図にあり、ボタンの上のカードは計画した日とその距離を引き続き一覧します。',
  'help.guide.map-dawarich-trail.tip.1':
    'オンかオフかは、このブラウザーセッションの間、旅行ごとに記憶されます。ルートがオンの間、TREK は2分ごとに Dawarich に問い合わせ直すので、進行中の旅行は再読み込みなしで追いつきます。ルート自体は決して保存されないので、TREK のデータベースにもバックアップにもなく、オフラインでは出ません。',
  'help.guide.map-dawarich-trail.tip.2':
    'ボタンのラベルが空の地図を説明します。届く途中は「記録されたルートを読み込み中…」、ほかに「この日付には記録がありません」、「記録されたルートを読み込めませんでした」、TREK がオフラインのときは「記録されたルートの表示には接続が必要です」です。',
  // map-compass
  'help.guide.map-compass.title': '地図を回して北を見つけ直す',
  'help.guide.map-compass.goal': '進む方向を向くように地図を回し、1クリックで北に戻します。',
  'help.guide.map-compass.step.1':
    '右ボタンのドラッグ、または Ctrl を押しながら左ボタンのドラッグで地図を回します。タッチ画面では2本の指でひねります。地図の上部、カテゴリアイコンの列の隣にある丸いコンパスも一緒に回ります。矢印は常に北を指すので、回した分だけ傾きます。',
  'help.guide.map-compass.step.2':
    'コンパスをクリックします。ボタンの名前どおり「Reset north」が、地図をゆっくり北を上にした平らな表示へ戻し、矢印はまたまっすぐ立ちます。',
  'help.guide.map-compass.result':
    '地図はまた北が上で平らになり、旅行には何も変わっていません。コンパスはカメラを動かすだけです。',
  'help.guide.map-compass.tip.1':
    'コンパスがあるのは MapLibre GL と Mapbox GL の地図だけです。Leaflet の地図は回せないので、コンパスもありません。「設定」の「地図」にある「地図プロバイダー」がどれを使うかを決め、「地図を保存」がその選択を保ちます。',
  'help.guide.map-compass.tip.2':
    'クリックは傾きも取り除きます。右ボタンで上下にドラッグすると表示が傾き、「Reset north」は回転と一緒にそれも水平に戻します。Mapbox GL で「3D建物・地形」がオンなら、3D 表示も、また傾けるまで平らになります。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    'グループが一緒に計画を立てるタブです。左に「チャット」、その横に共有の「ノート」と「リンク」、その下に「投票」、最後に「次にすること」があります。ここに書かれたものはすべて、再読み込みなしに、ほかのメンバー全員の画面に同時に出ます。',
  'help.ctx.trip-collab.bullet.1':
    '「チャット」は左の列です。「メッセージを入力…」に書いて Enter を押します。Shift と Enter で改行になります。スマイリーは絵文字を足し、「画像を添付」はメッセージに最大4枚の写真を付けます。',
  'help.ctx.trip-collab.bullet.2':
    'メッセージにカーソルを重ねると「返信」が、自分のメッセージにはさらに「削除」が出ます。右クリックすると8つのクイックリアクションが出ます。削除したメッセージは「メッセージを削除しました」という1行だけを残します。',
  'help.ctx.trip-collab.bullet.3':
    '「ノート」は共有のメモ帳です。「新規ノート」で1つ書き、その隣の歯車が名前と色のための「カテゴリ管理」を開きます。カードには「展開」「固定」「編集」「削除」が付いています。',
  'help.ctx.trip-collab.bullet.4':
    '「リンク」は旅行が頼りにするアドレスを集めます。「リンクを追加」はタイトルと http または https のアドレスを受け取ります。「リンクを編集」「リンクを固定」「リンクを削除」はチップの末尾にあり、固定したリンクは先頭にとどまります。',
  'help.ctx.trip-collab.bullet.5':
    '「投票」は物事を決めます。「新しい投票」は少なくとも2つの選択肢を付けて質問します。選択肢をクリックすればそれがあなたの票で、「閉じる」が投票を終わらせ、「削除」が投票を消します。',
  'help.ctx.trip-collab.bullet.6':
    '「次にすること」は、まだ先にある旅行の立ち寄り先を最大8つまで、時刻とそこにいる人とともに並べます。読むのは日程だけで、時刻はそちらで設定します。',
  // write-note
  'help.guide.write-note.title': '共有のノートを書く',
  'help.guide.write-note.goal':
    'グループ全体に必要なもの、決まりごと、住所、リマインダーを、みんながまた見つけられる場所に置きます。',
  'help.guide.write-note.step.1': '「ノート」パネルの上にある「新規ノート」をクリックします。フォームが開きます。',
  'help.guide.write-note.step.2':
    '「ノートのタイトル」はカードが持つ名前です。フォームが必ず求めるのはこれだけで、中身が入るまで「作成」は灰色のままです。',
  'help.guide.write-note.step.3':
    'その下の大きな箱が本文を持ち、Markdown を受け取ります。太字の語、リスト、見出しが使えます。カードには最初の数行が出て、そこの「展開」がノート全体を開きます。',
  'help.guide.write-note.step.4':
    '「カテゴリ」の下で、このノートが属するものを選びます。その色がカードの色になります。丸い錠剤の形をしたものはすでにあるカテゴリで、新しいものは「カテゴリ管理」で作ります。',
  'help.guide.write-note.step.5':
    '「ウェブサイト」はノートに属するリンクを受け取ります。するとカードに、それを開く Link のタイルが付きます。',
  'help.guide.write-note.step.6': '「作成」をクリックします。',
  'help.guide.write-note.result':
    'ノートは「ノート」パネルのカードになり、カテゴリの色をまとい、すでにほかのメンバー全員の画面にあります。',
  'help.guide.write-note.tip.1':
    'カードの「固定」はそれをパネルの一番上に保ちます。その下はすべて、最後に変更された時刻の順に並びます。',
  'help.guide.write-note.tip.2':
    '「新規ノート」の隣の歯車は「カテゴリ管理」を開きます。そこでカテゴリは色を得て、すべての場所で一度に名前を変えられ、どのノートも使う前に追加できます。',
  'help.guide.write-note.tip.3':
    '「ファイルを添付」はノートに文書を付けます。「添付」がファイル選択を開き、画像や PDF はフォームに貼り付けるだけでも構いません。',
  'help.guide.write-note.tip.4':
    '「ノート」は「アドオン」の下、「Collab」の下にある独立したスイッチです。管理者はこれだけを切って、「チャット」「リンク」「投票」「次にすること」を動かしたままにできます。',
  // shared-links
  'help.guide.shared-links.title': '旅行のリンクを集める',
  'help.guide.shared-links.goal':
    '予約サイト、共有アルバム、時刻表を1か所に置き、それを探してチャットをさかのぼらずにすませます。',
  'help.guide.shared-links.step.1': '「リンク」パネルの上にある「リンクを追加」をクリックします。',
  'help.guide.shared-links.step.2':
    '「リンクのタイトル」でリンクに名前を付け、その下の欄にアドレスを貼り、「リンクを保存」をクリックします。',
  'help.guide.shared-links.step.3':
    'チップには名前と、指し示す先のサイトが出ます。クリックすると新しいタブでそのページが開きます。',
  'help.guide.shared-links.step.4':
    '末尾にある3つの小さなボタンは「リンクを編集」「リンクを固定」「リンクを削除」です。「リンクを固定」はチップをパネルの先頭に移し、「リンクを削除」は何も聞きません。',
  'help.guide.shared-links.result':
    'リンクは「リンク」パネルのチップになり、先頭に固定され、同時にメンバー全員の画面にあります。',
  'help.guide.shared-links.tip.1':
    '受け取るのは http と https のアドレスだけです。欄はそれ以外を、保存する前に拒みます。',
  'help.guide.shared-links.tip.2':
    '固定したリンクが先に、そのあとが新しい順です。タイトルの隣の小さなアイコンはそのサイト自身のファビコンで、サイトから取ってきます。ですからインターネットがないと、チップは代わりに素のリンクの記号を出します。',
  'help.guide.shared-links.tip.3':
    '「リンク」は「アドオン」の下、「Collab」の下にある独立したスイッチです。ですから管理者は、タブのほかの部分に触れずにこのパネルだけを切れます。',
  // create-poll
  'help.guide.create-poll.title': 'グループに尋ねる',
  'help.guide.create-poll.goal': 'チャットでは誰も答えない質問を、みんながチェックできる投票に変えます。',
  'help.guide.create-poll.step.1': '「投票」パネルの上にある「新しい投票」をクリックします。',
  'help.guide.create-poll.step.2':
    '質問を書きます。箱の下の「Markdown対応」は、太字の語、改行、短いリストがここで効くという意味です。',
  'help.guide.create-poll.step.3': '「選択肢 1」と「選択肢 2」を埋めます。中身の入った選択肢2つが最小です。',
  'help.guide.create-poll.step.4':
    '「+ 選択肢を追加」は3つ目、4つ目と、必要なだけ足します。行の隣の小さな×印は1つをまた取り去ります。',
  'help.guide.create-poll.step.5':
    '「複数選択」は、全員が2つ以上の選択肢にチェックを入れられるようにします。切ったままなら、ほかを選んだときに票がそちらへ移ります。',
  'help.guide.create-poll.step.6': '「投票を作成」をクリックします。',
  'help.guide.create-poll.result': '投票は「投票」パネルの一番上に、開いた状態で、まだ誰も投票していないまま立ちます。',
  'help.guide.create-poll.tip.1': '質問は Markdown として表示され、選択肢は素のテキストのままです。',
  'help.guide.create-poll.tip.2':
    '質問と、中身の入った選択肢が少なくとも2つそろうまで、「投票を作成」は灰色のままです。',
  'help.guide.create-poll.tip.3':
    '締切はスマートフォンのアプリでしか設定できません。締切のある投票は、ここでは残り時間を琥珀色のチップで出し、時間が尽きると終了扱いになります。',
  'help.guide.create-poll.tip.4':
    '「投票」は「アドオン」の下、「Collab」の下にある独立したスイッチです。管理者はこれだけを切って、ほかの4つのパネルを動かしたままにできます。',
  // vote-poll
  'help.guide.vote-poll.title': '投票して結果を読む',
  'help.guide.vote-poll.goal': '自分の票を入れ、グループがどこに立っているかを見て、考えを変えます。',
  'help.guide.vote-poll.step.1': '選びたい選択肢をクリックします。その丸が塗られ、後ろのバーが伸びます。',
  'help.guide.vote-poll.step.2':
    'これで結果全体が読めます。バーが割合、右にパーセント、小さな丸はその選択肢を選んだ人たちです。',
  'help.guide.vote-poll.step.3':
    '考えが変わったら、別の選択肢をクリックします。「複数選択」でない投票では、2つ目が増えるのではなく、あなたの票がそちらへ移ります。',
  'help.guide.vote-poll.step.4':
    '質問の下に、その投票の票数が立っています。すでに選んだ選択肢をクリックすると票が取り下げられ、数もまた下がります。',
  'help.guide.vote-poll.result':
    'あなたのチェックは1つの選択肢にあり、バーはグループの分かれ方を示し、丸は誰が何を選んだかを言います。',
  'help.guide.vote-poll.tip.1':
    'バーとパーセントは、自分が投票したあと、または投票が終了したあとにだけ出ます。途中の情勢に誰も引っぱられないためです。',
  'help.guide.vote-poll.tip.2':
    '投票は決して匿名ではありません。選択肢の丸の1つにカーソルを重ねると、その後ろの名前が出ます。',
  // close-poll
  'help.guide.close-poll.title': '投票を閉じる、または消す',
  'help.guide.close-poll.goal': 'グループが決めたら投票を止め、もう誰も必要としない投票を片づけます。',
  'help.guide.close-poll.step.1':
    '投票の角にある錠前の「閉じる」が投票を終わらせます。選択肢はクリックを受け付けなくなります。',
  'help.guide.close-poll.step.2':
    '終了した投票はパネルの一番下の「終了」という見出しの下に沈み、「終了」のバッジを付け、投票したかどうかにかかわらず全員に結果を見せます。勝った選択肢は緑に色づきます。',
  'help.guide.close-poll.step.3':
    '同じ角のゴミ箱である「削除」が投票を消します。二度尋ねるものは何もなく、票も一緒に消えます。',
  'help.guide.close-poll.result':
    '投票はメンバー全員のパネルから消えます。閉じただけのものは、結果とともに一番下で読めるまま残ります。',
  'help.guide.close-poll.tip.1':
    '閉じることは取り消せません。再開はありません。誤って閉じた投票は、もう一度尋ね直すしかありません。',
  'help.guide.close-poll.tip.2':
    '「削除」は、その投票とそこにあるすべての票を、全員から、すぐに、何も尋ねずに取り去ります。',
  // whats-next
  'help.guide.whats-next.title': '「次にすること」を読む',
  'help.guide.whats-next.goal': '計画を開かずに、グループが次に何をするのかを見ます。',
  'help.guide.whats-next.step.1':
    'このパネルは、まだ先にある旅行の立ち寄り先を最大8つまで、時刻順に、日ごとの見出しの下に並べます。見出しは「今日」「明日」または日付です。',
  'help.guide.whats-next.step.2':
    '行の左には時刻が立ちます。開始時刻、「〜」、そして立ち寄り先に終了時刻があればそれが出ます。まだ時刻が設定されていなければ TBD です。',
  'help.guide.whats-next.step.3':
    '名前の下のチップは、その立ち寄り先にいる人たちです。誰も選ばれていなければ、旅行の全員が並びます。',
  'help.guide.whats-next.result':
    'これから来るものの一覧で、読むためだけのものです。計画に従い、ここでは何も計画を変えません。',
  'help.guide.whats-next.tip.1':
    'ここでは何も設定しません。時刻は日程から来ます。そちらで変えれば、この一覧はすぐに従います。',
  'help.guide.whats-next.tip.2':
    '並ぶのはまだ先にあるものだけです。時刻が過ぎた立ち寄り先は落ち、旅行の終わりにはパネルが空になります。',
  'help.guide.whats-next.tip.3':
    '「次にすること」は「アドオン」の下、「Collab」の下にある独立したスイッチで、デスクトップのパネルです。スマートフォンのアプリの「Collab」タブにはありません。',
  // trip-chat
  'help.guide.trip-chat.title': 'グループと話す',
  'help.guide.trip-chat.goal':
    '何かを言い、ある1つのメッセージに答え、別のメッセージに反応し、自分のメッセージを取り下げます。',
  'help.guide.trip-chat.step.1':
    '「メッセージを入力…」に書いて Enter を押します。箱の隣の青い矢印も同じことをします。Shift と Enter はその代わりに改行になります。',
  'help.guide.trip-chat.step.2':
    'スマイリーは絵文字のピッカーを開きます。中には Smileys、Reactions、Travel があります。選んだものは書きかけの文に足されるだけで、それ自体が送られるわけではありません。',
  'help.guide.trip-chat.step.3':
    'ほかの人のメッセージにカーソルを重ねると、角に小さな丸いボタンが出ます。それが「返信」です。',
  'help.guide.trip-chat.step.4':
    '答えるメッセージは箱の上に引用されます。書いて送れば、引用はあなたの吹き出しに一緒に乗ります。引用の×印はそれをまた落とします。',
  'help.guide.trip-chat.step.5':
    'メッセージを右クリックすると8つのクイックリアクションが出ます。自分のものは吹き出しの下に付き、同じものをもう一度クリックすると取り下げられます。',
  'help.guide.trip-chat.step.6':
    '自分のメッセージには「返信」の隣に「削除」が付いています。これはメッセージを取り去り、「メッセージを削除しました」という1行だけを残します。戻る道はありません。',
  'help.guide.trip-chat.result':
    'あなたの返事は引用したメッセージの下に付き、リアクションは3つ目のメッセージにぶら下がり、取り下げたものはそう言う1行だけを残します。',
  'help.guide.trip-chat.tip.1': 'Enter で送信、Shift と Enter で改行です。絵文字だけのメッセージは大きく表示されます。',
  'help.guide.trip-chat.tip.2':
    '「画像を添付」は1つのメッセージに最大4枚の写真を取ります。写真は箱に貼り付けたり、落としたりするだけでも構いません。',
  'help.guide.trip-chat.tip.3':
    'リンクの入ったメッセージには、その下にプレビューカードが付きます。取ってくるのはあなた自身の TREK ですから、あなたしか届かない先へのリンクは素のリンクのままです。',
  'help.guide.trip-chat.tip.4':
    '「チャット」は「アドオン」の下、「Collab」の下にある独立したスイッチです。管理者はこれだけを切って、「ノート」「リンク」「投票」「次にすること」を動かしたままにできます。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'リスト',
  'help.ctx.trip-lists.summary':
    '1つの旅行に2つのリストです。誰が何を持っていき、それが何グラムかまで入る持ち物リストと、旅行の前と最中に起きるべきことを並べるToDoリスト。このタブは「リスト」アドオンが有効な間だけあります。',
  'help.ctx.trip-lists.bullet.1':
    '上の「持ち物リスト」と「ToDo」が2つを切り替え、それぞれに何があるかも数えます。右のボタンは、開いているほうのものです。',
  'help.ctx.trip-lists.bullet.2':
    '持ち物リストはリストごとにまとまります。書類、衣類、名前は自由です。それぞれに色の点と、梱包済みと全体の数を出すバッジと、「名前を変更」「すべてチェック」「すべて解除」「リストを削除」が入った三つの点があります。上のバーの「リストを追加」が新しいリストを作ります。',
  'help.ctx.trip-lists.bullet.3':
    '1行はチェックボックスと名前、そして持って行く人、数量、グラム単位の重さを示す小さなバッジと、「バッグ管理」が有効ならバッグの丸、さらにゴミ箱と、「リストへ移動」「共有」「名前を変更」「削除」が入った三つの点です。その行が使っていないものはポインターを合わせるまで薄く表示され、左のつまみはその行を自分のリストの中で上下に動かします。',
  'help.ctx.trip-lists.bullet.4':
    '「みんなで」と「マイリスト」が持ち物リストを2つに分けます。全員が見るプールと、あなた自身のものです。「すべて」「未完了」「完了」が開いているほうを絞り込み、上のバーが梱包済みの数を数えます。',
  'help.ctx.trip-lists.bullet.5':
    '「テンプレートを適用」と「テンプレートとして保存」は、打ち込まずにリストを埋めたり残したりします。その隣の2つのアイコンは、リストを印刷物、PDF、ファイルとしてエクスポートし、リストをインポートします。進捗バーの横の赤いボタンはチェック済みのアイテムが何件あるかを出し、まとめて片づけます。',
  'help.ctx.trip-lists.bullet.6':
    '「ToDo」には専用のサイドバーがあります。進捗カード、「すべて」「自分のタスク」「期限切れ」「完了」のフィルター、リストごとに1行、その下に「リストを追加」です。タスクはカードの中に並び、カードの見出しにはフィルター名が出て、「優先度」か「期限」の並び替えもそこにあります。タスクをクリックすると右のパネルで開き、「新しいタスクを追加...」は画面の中央に「新しいタスク」のフォームを開きます。',
  // packing-categories
  'help.guide.packing-categories.title': '持ち物リストを作る',
  'help.guide.packing-categories.goal':
    '持っていくものをリストにまとめ、アイテムを入れ、どのリストを誰が受け持つかを決めます。',
  'help.guide.packing-categories.step.1':
    'リストの上のバーにある「リストを追加」をクリックし、「リスト名（例：衣類）」に名前を入力して「追加」をクリックします。',
  'help.guide.packing-categories.step.2':
    '新しいリストは空の行が1つの状態で始まります。「項目を追加」をクリックし、「項目名...」に入力してEnterを押します。入力欄は次のために開いたままです。',
  'help.guide.packing-categories.step.3':
    '行の名前は、名前をクリックするか、右端の三つの点の「名前を変更」で変えます。',
  'help.guide.packing-categories.step.4':
    'リストのヘッダーにある破線の丸は、旅行メンバーをそのリストに割り当てます。名前を選ぶと出てくるチップは、クリックするとその人をまた外します。',
  'help.guide.packing-categories.step.5':
    'ヘッダーの端の三つの点に残りが入っています。「名前を変更」「すべてチェック」「すべて解除」、そして「リストを削除」で、これはリストと中身のすべてを、もう一度確認せずに消します。',
  'help.guide.packing-categories.result':
    '新しいリストは、アイテムを下に従え、色の点を付けてグリッドに並び、バッジがもう梱包済みの数を数えます。',
  'help.guide.packing-categories.tip.1':
    'リストはそのアイテムそのものです。最後の1つを削除すると行はプレースホルダーに変わり、リストは場所と色を保ちます。その行も削除すると、リストはなくなります。',
  'help.guide.packing-categories.tip.2':
    '誰かをリストに割り当てると、その人に持ち物の通知が届きます。アイテムを誰が見られるかは変わりません。それは行の三つの点にある「共有」です。',
  'help.guide.packing-categories.tip.3':
    '2つのリストが同じ名前でも構いません。TREKは内部で区別するので、名前は入力したままになります。',
  // check-off-packing
  'help.guide.check-off-packing.title': '荷造りしながらチェックしていく',
  'help.guide.check-off-packing.goal': 'バッグに入れたものに印を付け、バーを見て、梱包済みのアイテムを片づけます。',
  'help.guide.check-off-packing.step.1': '行の左のボックスをクリックします。名前に取り消し線が入り、バーが動きます。',
  'help.guide.check-off-packing.step.2':
    '上のバーは、リストにあるすべてに対して梱包済みの数を、件数でもパーセントでも数えます。',
  'help.guide.check-off-packing.step.3':
    'リストをまるごと一度に扱うなら、そのヘッダーの三つの点に「すべてチェック」と「すべて解除」があります。',
  'help.guide.check-off-packing.step.4':
    '「すべて」「未完了」「完了」がグリッドを絞ります。「未完了」はまだ足りないものだけを残すので、すっかり梱包済みのリストはそこから外れます。',
  'help.guide.check-off-packing.step.5':
    '進捗バーの横の「チェック済み3件を削除」は、ブラウザの確認を1回はさんでから、チェック済みのアイテムをすべて一度に削除します。',
  'help.guide.check-off-packing.result': 'まだ未完了のものだけが並び、上のバーが荷造りの進み具合を伝えます。',
  'help.guide.check-off-packing.tip.1': 'チェック済みのアイテムも名前を変えられます。名前をクリックしてください。',
  'help.guide.check-off-packing.tip.2':
    '「すべてチェック」と「すべて解除」は、そのリスト自身の三つの点から、一度に1つのリストにだけ効きます。',
  'help.guide.check-off-packing.tip.3':
    'すべてのアイテムにチェックが入ると、カウンターは「すべて梱包済み！」に変わり、バーが緑になります。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '持ち物テンプレートを適用する',
  'help.guide.apply-packing-template.goal': '出来合いのリストを旅行に取り込み、この旅行のリストを次のために残します。',
  'help.guide.apply-packing-template.step.1': 'リストの上のバーで「テンプレートを適用」をクリックします。',
  'help.guide.apply-packing-template.step.2': 'テンプレートを選びます。各行に名前と、入っているアイテムの数が出ます。',
  'help.guide.apply-packing-template.step.3':
    'アイテムは今いるビューに入ります。「みんなで」なら全員が見るプールに、「マイリスト」ならあなたのものになります。',
  'help.guide.apply-packing-template.step.4':
    'この旅行のリストを次の旅行のために残すには、「テンプレートとして保存」でダイアログを開き、名前を入力して「保存」をクリックします。',
  'help.guide.apply-packing-template.result':
    'テンプレートのリストとアイテムが、もとからあったものの隣に、旅行の中にあります。',
  'help.guide.apply-packing-template.tip.1':
    'テンプレートが運ぶのは名前とリストだけです。数量、重さ、バッグ、すでにチェックが入っているかどうかは引き継がれません。',
  'help.guide.apply-packing-template.tip.2':
    '「テンプレートを適用」はテンプレートが1つできてから出ます。なければボタン自体が出ません。',
  'help.guide.apply-packing-template.tip.3':
    '「テンプレートとして保存」はインスタンスの管理者にだけ、しかもリストにアイテムがある間だけ出ます。保存されるのは共有プールとあなた自身のアイテムで、他のメンバーの個人のものは決して入りません。',
  // import-packing-list
  'help.guide.import-packing-list.title': '持ち物リストをまるごと貼り付ける',
  'help.guide.import-packing-list.goal': 'どこかにすでにあるリストを、一度で持ち物のアイテムに変えます。',
  'help.guide.import-packing-list.step.1': 'リストの上のバーで、下向き矢印のインポートボタンをクリックします。',
  'help.guide.import-packing-list.step.2':
    '1行につき1項目です。カテゴリ, 名前, 重量(g・任意), バッグ(任意), checked/unchecked(任意)。ボックスの中の灰色の見本が4つの形をすべて見せています。Markdown のリストも使えます。見出しがリストの名前になり、「- [ ]」と「- [x]」がアイテムになります。',
  'help.guide.import-packing-list.step.3':
    'または「CSV/TXT/MDを読み込む」で行をファイルから読み込みます。.csv、.txt、.md のいずれかを受け取り、ボックスの中身を置き換えます。',
  'help.guide.import-packing-list.step.4': '「インポート」をクリックします。ボタンは読み取れた行の数を出します。',
  'help.guide.import-packing-list.result':
    'どの行も1つの行になり、最初のフィールドが指すリストに入ります。もとからあったものには何も触れません。',
  'help.guide.import-packing-list.tip.1':
    'カンマ、セミコロン、タブがどれもフィールドを区切り、二重引用符はフィールドをひとまとめにするので、「Shirt, blue」は1つの名前のままです。値が1つだけの行はただの名前で、自分のリストを持たない行は「その他」に入ります。名前の前に「3x」を付けると数量になります。',
  'help.guide.import-packing-list.tip.2':
    '4番目のフィールドで名前を挙げたバッグは、旅行にまだなければ作られます。重さとバッグをまとめて読み込めるのはここだけで、テンプレートが運ぶのは名前とリストだけです。',
  // export-packing-list
  'help.guide.export-packing-list.title': '持ち物リストを印刷またはエクスポートする',
  'help.guide.export-packing-list.goal':
    'リストを紙で、PDF で、またはほかのアプリや次の旅行のためのファイルとして持ち出します。',
  'help.guide.export-packing-list.step.1': 'リストの上のバーで、上向き矢印のエクスポートボタンをクリックします。',
  'help.guide.export-packing-list.step.2':
    '「Markdown チェックリスト (.md)」と「インポート用 CSV (.csv)」は、リストをすぐにファイルとして保存します。',
  'help.guide.export-packing-list.step.3':
    '「印刷または PDF として保存」をクリックします。プレビューはリストを1ページとして見せます。上に旅行とその日付、その下にリストごとのカードが並び、それぞれにチェック用のボックスが付きます。',
  'help.guide.export-packing-list.step.4':
    'プレビューの下の「印刷または PDF として保存」をクリックします。ブラウザの印刷ダイアログが開くので、プリンターを選ぶか、ファイルとして残すなら「PDF に保存」を選びます。',
  'help.guide.export-packing-list.result':
    '印刷物とファイルには、開いているビュー、つまり「みんなで」か「マイリスト」が、数量、重さ、チェックとともに入ります。',
  'help.guide.export-packing-list.tip.1':
    'CSV は「インポート」が読む形式で、バッグも含まれます。そのため自分だけの持ち物テンプレートとして使えます。次の旅行にインポートしてください。',
  'help.guide.export-packing-list.tip.2':
    'Markdown ファイルは Obsidian、Notion、GitHub でチェックリストとして開き、同じように「インポート」で戻せます。',
  // share-packing-item
  'help.guide.share-packing-item.title': 'アイテムを誰が見て誰が持っていくかを決める',
  'help.guide.share-packing-item.goal':
    'アイテムを、グループのプール、自分のリスト、そして持っていってあげる相手の間で動かします。',
  'help.guide.share-packing-item.step.1':
    'リストの上の「みんなで」は全員が見るプール、「マイリスト」はあなた自身のもので、どちらも中の数を数えます。「マイリスト」をクリックして自分のほうを見ます。',
  'help.guide.share-packing-item.step.2': '「みんなで」に戻り、行の端の三つの点を開いて「共有」をクリックします。',
  'help.guide.share-packing-item.step.3':
    '段階は3つです。「みんなで」はグループのプールに入り、全員に見えます。「個人」は自分だけが見られます。「共有する相手…」では、そのアイテムの対象になる人を選びます。',
  'help.guide.share-packing-item.step.4':
    '「個人」のアイテムは「マイリスト」にしかありません。切り替えて探してください。',
  'help.guide.share-packing-item.step.5':
    'もう一度「共有」を開き、「共有する相手…」の下で名前にチェックを入れます。アイテムはその人のリストにも出て、行には共有している人数を数える小さなバッジが付きます。',
  'help.guide.share-packing-item.result': 'アイテムは選んだ段階に収まり、行には誰が持っていくかが出ます。',
  'help.guide.share-packing-item.tip.1':
    'アイテムの共有を変えられるのは、それを持っていく人だけです。共有された相手は自分の「マイリスト」でそれを見て、あなたの名前が付いた状態でチェックを入れられます。',
  'help.guide.share-packing-item.tip.2':
    '他の人が持っていくアイテムでは、代わりに別の2つのボタンが出ます。「私も持っていけます」はあなたをその人の隣に加え、「マイリストにコピー」は自分用の非公開のコピーを作ります。',
  'help.guide.share-packing-item.tip.3':
    '新しいアイテムは、追加したビューを受け継ぎます。「マイリスト」で追加すれば「個人」、「みんなで」で追加すればプールに入ります。',
  // packing-bags
  'help.guide.packing-bags.title': 'バッグの重さを量る',
  'help.guide.packing-bags.goal':
    'すべてのアイテムに重さを付け、アイテムをバッグに分け、どのバッグも航空会社の制限内に収めます。',
  'help.guide.packing-bags.step.1': '丸の手前の重さのバッジをクリックし、アイテムの重さをグラムで入力します。',
  'help.guide.packing-bags.step.2': '行の端の丸が、そのアイテムのバッグです。クリックします。',
  'help.guide.packing-bags.step.3':
    'バッグがまだなければ、「バッグを追加」、名前、Enterです。バッグが作られ、アイテムはそのまま中に入ります。',
  'help.guide.packing-bags.step.4':
    'バッグが1つできるとすぐ、右に「バッグ」パネルが出ます。名前、重さ、満たし具合のバー、運ぶ人、入っているアイテムの数、そして「未割り当て」と「総重量」です。',
  'help.guide.packing-bags.step.5':
    '「制限を設定」をクリックし、航空会社の言い方どおり、制限をキログラムで入力します。',
  'help.guide.packing-bags.step.6': 'バッグの名前の横の破線のプラスが、誰が運ぶかを示します。',
  'help.guide.packing-bags.result':
    '右の「バッグ」パネルが、各バッグの重さを制限と並べて、どのバッグにも入っていないもの、そして合計を出します。',
  'help.guide.packing-bags.tip.1':
    '重さの欄、バッグの丸、「バッグ」パネルは、管理者が「リスト」アドオンの下で「バッグ管理」を有効にしている間だけあります。',
  'help.guide.packing-bags.tip.2':
    'バッグの重さはサーバー側で、あなたに見えないものも含めて全メンバーのアイテムを合計します。だからその数字は、本当にそのバッグの重さです。',
  'help.guide.packing-bags.tip.3':
    '制限のないバッグは、いちばん重いバッグを基準に描かれるので、バーは比べられるままです。制限を付ければ、バーはそちらを基準に読まれます。',
  // create-todo
  'help.guide.create-todo.title': 'タスクを追加する',
  'help.guide.create-todo.goal': 'やるべきことを、リスト、優先度、日付、担当者を添えて書き留めます。',
  'help.guide.create-todo.step.1': '右上の「新しいタスクを追加...」をクリックします。',
  'help.guide.create-todo.step.2': '「タスク名」で名前を付け、覚えておきたいことは「説明」に入れます。',
  'help.guide.create-todo.step.3':
    '「リスト」がタスクをまとめます。1つ選ぶか、その隣のプラスを使って小さなダイアログで新しいリストに名前を付けます。',
  'help.guide.create-todo.step.4': '「優先度」は4つのボタンです。「なし」、P1、P2、P3で、赤から青へと下がります。',
  'help.guide.create-todo.step.5': '「期限」はカレンダーを開き、「担当者」はタスクに名前を付けます。',
  'help.guide.create-todo.step.6': '「タスクを作成」をクリックします。',
  'help.guide.create-todo.result':
    'タスクは、優先度、期限、リスト、担当者のバッジを付けて一覧に入り、右のパネルで開きます。',
  'help.guide.create-todo.tip.1': '必須なのは名前だけです。ほかはあとから右のパネルで埋められます。',
  'help.guide.create-todo.tip.2': 'サイドバーでリストを選んでいると、新しいタスクはそのリストから始まります。',
  'help.guide.create-todo.tip.3': '名前の欄でEnterを押すと、ほかの欄に触れずにそのままタスクができます。',
  // todo-filters
  'help.guide.todo-filters.title': 'タスクを見つけて変える',
  'help.guide.todo-filters.goal': 'タスクの一覧を今だいじなものまで絞り、たどり着いたタスクを編集します。',
  'help.guide.todo-filters.step.1':
    'サイドバーの「タスク」です。「すべて」はまだ未完了のものすべて、「自分のタスク」はあなたに掛かっているもの、「期限切れ」は日付が過ぎたもの、「完了」は終わったものです。どれにも件数が付いています。「期限切れ」をクリックします。',
  'help.guide.todo-filters.step.2':
    '「リスト」の下にはリストごとに1行あります。1つ選ぶと、そのリストが、終わったタスクも含めて出ます。',
  'help.guide.todo-filters.step.3':
    'リストの見出しにある並び替えは、画面にあるものを並べ替えます。「優先度」はP1を先に、「期限」はいちばん近い締め切りを先にします。2つは一度に片方だけで、もう一度クリックすると自分の順に戻ります。',
  'help.guide.todo-filters.step.4': 'タスクをクリックすると、右のパネルで開きます。',
  'help.guide.todo-filters.step.5':
    '必要なところを変えます。「説明」「優先度」「リスト」「期限」「担当者」です。それから「変更を保存」。パネルの見出しにあるチェックボックスでタスクを完了にでき、「削除」はその場で消します。',
  'help.guide.todo-filters.result': '一覧には求めたタスクだけが出て、右のパネルが選んだ1つを編集します。',
  'help.guide.todo-filters.tip.1':
    'リストの行が数えるのはまだ未完了のものだけですが、選ぶと終わったタスクも出ます。「すべて」「自分のタスク」「期限切れ」は終わったものを隠し、「完了」はそれしか出しません。',
  'help.guide.todo-filters.tip.2':
    '並び替えの「優先度」と「期限」は互いを排除し、どちらかが効いている間は、行を自分の順に並べ替えることはできません。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '予約',
  'help.ctx.trip-bookings.summary':
    '移動手段以外に旅行で予約したものをすべて収めるタブです。宿泊先、レストランの席、チケット、ツアー、駐車場が入ります。予約はどれも「保留」か「確定」のカードになり、予約コード、書類、同行者、費用を携えています。',
  'help.ctx.trip-bookings.bullet.1':
    '右上の「手動予約」がフォームを開きます。ここで作れるのは「宿泊」「レストラン」「イベント」「ツアー」「駐車場」「その他」の6種類です。航空便や列車などは「移動」タブにあり、ここには現れません。',
  'help.ctx.trip-bookings.bullet.2':
    '「ファイルからインポート」は確認書を解析に渡します。EML、PDF、PKPass、HTML、TXT が使え、1ファイル 10 MB まで、最大 5 ファイルです。このボタンは、サーバーがそれらを読めるときだけ現れます。',
  'help.ctx.trip-bookings.bullet.3':
    '見出しの横のチップは種類で絞り込み、それぞれが自分の件数を持ちます。「すべて」で全部が戻ります。予約に人が指定されると、チップの隣のアバターの行がタブをその一人に絞り込みます。',
  'help.ctx.trip-bookings.bullet.4':
    'カードは「保留」と「確定」の2つのセクションに並び、それぞれに件数が付きます。セクションの見出しをクリックすると折りたたまれ、開いているかどうかはこの旅行ごとに記憶されます。',
  'help.ctx.trip-bookings.bullet.5':
    'カードにはステータスの点、種類、タイトル、日付と時刻、「予約コード」、「場所／住所」、予約のリンク先、「リンク」、「メモ」、「ファイル」、「同行者」が載ります。',
  'help.ctx.trip-bookings.bullet.6':
    'カードの鉛筆は同じフォームをもう一度開きます。ごみ箱は一度だけ尋ね、それで予約は消えます。宿泊の場合は、日別計画の宿泊日とリンクされた支出も一緒に消えます。',
  // create-booking
  'help.guide.create-booking.title': '予約を作成する',
  'help.guide.create-booking.goal': 'レストラン、イベント、ツアー、駐車場など、何でも手入力で旅行に入れます。',
  'help.guide.create-booking.step.1': 'タブの右上の「手動予約」をクリックします。「新しい予約」が開きます。',
  'help.guide.create-booking.step.2':
    'フォーム上部の「同行者」の隣にあるリストから「予約タイプ」を選びます。このタブが作るのは「宿泊」「レストラン」「イベント」「ツアー」「駐車場」「その他」の6種類で、選択に応じてフォームが変わります。日付を日の範囲に取り替えるのは「宿泊」だけです。',
  'help.guide.create-booking.step.3':
    '「タイトル」を入力します。フォームが必ず求めるのはこの項目だけで、何か入るまで「追加」は押せません。',
  'help.guide.create-booking.step.4':
    '「日付」と「開始時刻」を設定し、終わりのある予約なら「終了日」と「終了時刻」も設定します。カレンダーは旅行期間内の日しか示さず、終わりが始まりより後でなければ赤でそう伝えて「追加」を止めます。',
  'help.guide.create-booking.step.5':
    '確認書の「予約コード」を入れて「ステータス」を設定します。「保留」か「確定」かで、カードが2つのセクションのどちらに入るかが決まります。',
  'help.guide.create-booking.step.6': '「追加」をクリックします。',
  'help.guide.create-booking.result':
    '予約は種類のチップと日付と予約コードを持つカードとしてそのセクションに並び、旅行のほかの全員にも現れます。',
  'help.guide.create-booking.tip.1':
    '「場所／住所」は入力中に実在の住所を示します。選ぶと書いた内容が置き換わり、自分で入力した住所はそのまま残ります。',
  'help.guide.create-booking.tip.2':
    '「リンク」には提供元にあるその予約のページを入れます。カードではそれが新しいタブで開くリンクになります。',
  'help.guide.create-booking.tip.3': '「メモ」は Markdown なので、箇条書きや太字の行はカードでもそのまま表示されます。',
  // booking-hotel
  'help.guide.booking-hotel.title': '宿泊先を予約する',
  'help.guide.booking-hotel.goal':
    '宿泊先を入力して、予約としても日別計画の宿泊日としても同時に数えられるようにします。',
  'help.guide.booking-hotel.step.1':
    '「手動予約」をクリックして「宿泊」を選びます。日付の項目が消え、その場所に宿泊用の項目がまとめて入ります。',
  'help.guide.booking-hotel.step.2':
    '「宿泊先」でホテルを選びます。一覧は旅行に登録された場所で、選ぶとその名前が「タイトル」に、住所が「場所／住所」に書き込まれます。',
  'help.guide.booking-hotel.step.3':
    '「開始」と「終了」を設定します。最初の宿泊日と、出発する朝です。どちらも旅行の日を日付付きで示し、2つは前後が入れ替わらないように保たれます。',
  'help.guide.booking-hotel.step.4':
    '「チェックイン」「チェックイン期限」「チェックアウト」と、確認書の「予約コード」を入力します。',
  'help.guide.booking-hotel.step.5': '「追加」をクリックします。',
  'help.guide.booking-hotel.result':
    'カードは日付ではなく日の範囲を持ち、チェックインとチェックアウトの時刻と住所が付きます。同じ滞在が計画のその日にも入ります。',
  'help.guide.booking-hotel.tip.1':
    '「宿泊」は「日付」と「開始時刻」を持たない唯一の種類です。その日付は「開始」と「終了」で、カレンダーではなく旅行の日から選びます。',
  'help.guide.booking-hotel.tip.2':
    '「宿泊先」を空のままにして、代わりに住所を入力することもできます。その場所が検索され、作成され、地図にピンが立ちます。',
  'help.guide.booking-hotel.tip.3': '予約を削除すると、日別計画の宿泊日も一緒になくなります。',
  // link-booking
  'help.guide.link-booking.title': '予約を計画に結び付ける',
  'help.guide.link-booking.goal':
    '予約をそれが属する立ち寄り先と場所にぶら下げて、必要になるところに現れるようにします。',
  'help.guide.link-booking.step.1': '結び付けたいカードの鉛筆をクリックします。「予約を編集」が開きます。',
  'help.guide.link-booking.step.2':
    '「日への割り当てにリンク」を開きます。一覧はあなたの計画そのもので、日ごとの見出しの下に、その日の立ち寄り先が番号と時刻付きで並びます。予約が属するものを選びます。',
  'help.guide.link-booking.step.3':
    '「場所 / アクティビティ」は場所そのものを結び付けます。そこで選ぶと、空のままにしてあった「タイトル」と「場所／住所」が埋まります。',
  'help.guide.link-booking.step.4': '「更新」をクリックします。',
  'help.guide.link-booking.result':
    'カードの「日への割り当てにリンク」にその日と立ち寄り先が示され、予約は日別計画でその立ち寄り先と一緒に動きます。',
  'help.guide.link-booking.tip.1':
    '一覧の先頭にある「リンクなし（単独）」で結び付けをまた外せます。「宿泊」には立ち寄り先の選択そのものがなく、宿泊日を通して結び付きます。',
  'help.guide.link-booking.tip.2':
    '日付のある日の立ち寄り先を選ぶと、空の「日付」が代わりに埋まります。すでに設定してある日付はそのままです。',
  // booking-travelers
  'help.guide.booking-travelers.title': '予約が誰のためかを示す',
  'help.guide.booking-travelers.goal': '予約が対象とする同行者を指定し、そのうえでその人の分だけを表示します。',
  'help.guide.booking-travelers.step.1':
    '鉛筆で予約を開きます。「同行者」はフォームの上部、「予約タイプ」の隣にあり、予約に誰もいない間は「同行者を割り当て」と表示されます。',
  'help.guide.booking-travelers.step.2':
    'そこをクリックして、この予約の対象となる人を選びます。名前の付いた「ゲスト」もリストに含まれます。選ばれた人にはチェックが付き、フィールドにアバターが表示されます。名前をもう一度クリックすると外れます。',
  'help.guide.booking-travelers.step.3': '「更新」をクリックします。',
  'help.guide.booking-travelers.step.4':
    '上のツールバーで、種類のチップの隣にある同行者のアバターをクリックすると、その人の予約だけが表示されます。',
  'help.guide.booking-travelers.result': 'カードに対象の人が並び、アバターの行がタブをその一人に絞り込みます。',
  'help.guide.booking-travelers.tip.1':
    'カードでは同行者は表示されるだけで、変更はできません。指定はここ、フォームで行います。',
  'help.guide.booking-travelers.tip.2':
    'アバターの行は、旅行のメンバーが2人以上いて、少なくとも1件の予約に誰かが指定されると現れます。選んだ内容はこのブラウザーのセッションの間だけ続きます。',
  // booking-files
  'help.guide.booking-files.title': 'バウチャーを予約と一緒に保管する',
  'help.guide.booking-files.goal': '確認書、チケット、パスを、それが属する予約に添付します。',
  'help.guide.booking-files.step.1':
    '鉛筆で予約を開き、「ファイル」まで下がって「ファイルを添付」をクリックします。すでに存在する予約では書類がすぐに上がり、TREK が「ファイルをアップロードしました」と伝えます。',
  'help.guide.booking-files.step.2': '書類は名前で並び、開くためのボタンと、その隣の X が付きます。',
  'help.guide.booking-files.step.3':
    '「既存ファイルをリンク」は、まだこの予約に付いていない旅行の書類を示します。選べば、もう一度アップロードすることなく添付されます。',
  'help.guide.booking-files.step.4': '「更新」をクリックします。',
  'help.guide.booking-files.result': 'カードの「ファイル」に書類が並び、そのひとつをクリックすると開きます。',
  'help.guide.booking-files.tip.1': 'まだ作成中の予約では、書類は待機し、「追加」をクリックした瞬間に上がります。',
  'help.guide.booking-files.tip.2':
    '書類の隣の X が外すのは結び付きだけで、書類そのものではありません。書類は旅行の「ファイル」タブに残ります。',
  'help.guide.booking-files.tip.3':
    'どの種類のファイルを添付できるかは管理者の「許可するファイル形式」の一覧次第です。初期状態では書類、テキスト、画像が許可されています。',
  // booking-cost
  'help.guide.booking-cost.title': '予約の金額を費用にする',
  'help.guide.booking-cost.goal': '予約にかかる金額を「費用」に入れ、支払う人たちで分けます。',
  'help.guide.booking-cost.step.1':
    '予約を開き、フォームの一番下まで進みます。「費用」の下に「支出を作成」と「既存の支出をリンク」があり、「予約を保存してから費用エディタを開きます。」という注記が付いています。',
  'help.guide.booking-cost.step.2':
    '「支出を作成」をクリックします。予約が保存され、そのフォームが閉じて、費用の編集画面が開きます。',
  'help.guide.booking-cost.step.3':
    '「何の支出ですか？」にはすでに予約のタイトルが入っています。「合計金額」を入れ、「通貨」と「日」を確かめます。',
  'help.guide.booking-cost.step.4':
    '「カテゴリ」は予約タイプから決まるものです。「誰が支払いましたか？」と、金額の分け方である「Split」を設定します。',
  'help.guide.booking-cost.step.5': '「支出を追加」をクリックします。',
  'help.guide.booking-cost.result':
    '予約のフォームでは支出が金額とともに「リンク済みの支出」の下に表示され、同じ支出がこの予約に結び付いた形で「費用」タブにも並びます。',
  'help.guide.booking-cost.tip.1':
    'カテゴリは種類に従います。「レストラン」は「飲食」に、「宿泊」は「宿泊」に、「駐車場」は「駐車場」になり、「イベント」と「ツアー」はどちらも「その他」に入ります。',
  'help.guide.booking-cost.tip.2':
    '1件の予約に複数の支出を付けられます。「既存の支出をリンク」は、「費用」にあってまだどこにも属していない支出を候補に出します。リンク済みの支出では、「リンクを解除し、支出は残す」が紐づけを外して「費用」に残し、ごみ箱は支出を削除します。',
  'help.guide.booking-cost.tip.3':
    '「費用」がフォームにあるのは「費用」アドオンが有効な間だけで、管理者が「アドオン」で切り替えます。',
  // filter-bookings
  'help.guide.filter-bookings.title': '予約を見つける',
  'help.guide.filter-bookings.goal': '長いタブを、探している種類、人、状態に絞り込みます。',
  'help.guide.filter-bookings.step.1':
    '見出しの横のチップは、この旅行が実際に使っている種類で、それぞれが持っている件数を添えています。「すべて」はタブ全体です。',
  'help.guide.filter-bookings.step.2':
    'チップをクリックするとその種類だけが残ります。もうひとつクリックすると両方が残ります。',
  'help.guide.filter-bookings.step.3': '「すべて」で全部が戻ります。',
  'help.guide.filter-bookings.step.4': 'チップの隣のアバターは同行者で絞り込み、1人でも一度に数人でも選べます。',
  'help.guide.filter-bookings.step.5':
    '「保留」と「確定」が2つのセクションで、それぞれに件数が付きます。見出しをクリックすると片方が折りたたまれ、戻ってきても折りたたまれたままです。',
  'help.guide.filter-bookings.result':
    'タブには選んだものだけが表示され、このブラウザーのセッションの間は戻ってきても選んだままです。',
  'help.guide.filter-bookings.tip.1':
    'チップは旅行にある種類しか示さないので、ツアーが1件もない旅行には「ツアー」のチップがありません。',
  'help.guide.filter-bookings.tip.2':
    '何にも一致しない絞り込みでは、タブが空になり「場所が見つかりません」と出ます。文言は場所の一覧のものですが、意味は同じです。',
  // import-booking-file
  'help.guide.import-booking-file.title': '確認書から予約を読み取る',
  'help.guide.import-booking-file.goal':
    'もう一度入力する代わりに、提供元が送ってきたメールや PDF から TREK に予約を取り出させます。',
  'help.guide.import-booking-file.step.1':
    'ツールバーの「ファイルからインポート」をクリックします。「予約確認書のインポート」が開きます。',
  'help.guide.import-booking-file.step.2':
    '確認書を枠にドロップするか、枠をクリックして選びます。EML、PDF、PKPass、HTML、TXT が使え、1ファイル 10 MB まで、最大 5 ファイルです。選んだファイルの名前が枠に出ます。',
  'help.guide.import-booking-file.step.3':
    '「インポート」をクリックします。読み取りは背後で進むので、ダイアログはすぐに閉じます。',
  'help.guide.import-booking-file.step.4':
    '右下のカードがファイル名の下で処理の様子を伝え、アプリの中を移動しても再読み込みしても付いてきます。読み取りが終わると「ファイルを解析中…」がチェックマークに変わり、カードが「インポート」を示します。それをクリックします。',
  'help.guide.import-booking-file.result':
    '予約は「保留」のカードになり、宿泊日、コード、「ファイル」の下の確認書を持ちます。滞在は計画のその日に置かれ、「費用」がオンなら料金はそれに結び付いた支出です。',
  'help.guide.import-booking-file.tip.1':
    '「ファイルからインポート」は、サーバーが確認書を読めるときだけあります。それには抽出処理か「AI 解析」アドオンのどちらかが要ります。後者は管理者が「アドオン」で切り替えます。',
  'help.guide.import-booking-file.tip.2':
    '何も読み取れなかった場合はカードがそう伝え、「Try AI parsing」を示します。これは同じファイルをそのままモデルに送ります。終わった解析は10分間保たれるので、確認はその間に始めてください。',
  'help.guide.import-booking-file.tip.3':
    '確認書が添付されるのは、その形式が管理設定の「許可するファイル形式」にあるときだけです。PDF は最初からありますが、メール、つまり EML は先に追加する必要があり、そうでなければ予約は確認書なしで保存されます。',
  // edit-booking
  'help.guide.edit-booking.title': '予約を変更する',
  'help.guide.edit-booking.goal':
    '時刻を直したり、後から届いた予約コードを足したり、予約を「保留」から「確定」に移したりします。',
  'help.guide.edit-booking.step.1':
    'カードの見出しにある鉛筆をクリックします。「予約を編集」が、その予約の持つ情報すべてとともに開きます。',
  'help.guide.edit-booking.step.2':
    '変える必要のあるところを変えます。ここでは業者がようやく送ってきた「予約コード」です。',
  'help.guide.edit-booking.step.3': '「ステータス」を「確定」にします。',
  'help.guide.edit-booking.step.4': '「更新」をクリックします。',
  'help.guide.edit-booking.result':
    'カードが移ります。確定した予約は緑の点の後ろ、「確定」のセクションに並び、旅行の全員にその移動が見えます。',
  'help.guide.edit-booking.tip.1':
    '「予約コード」が読めないのは、設定の「表示」にある「予約コードをぼかす」です。カーソルを乗せるか、クリックすれば読めます。',
  'help.guide.edit-booking.tip.2':
    '種類を変えると、リンクされた支出のカテゴリもそれに従います。ただし費用の編集画面で自分でカテゴリを選んでいた場合は変わりません。',
  'help.guide.edit-booking.tip.3': '宿泊もここで編集します。その「開始」と「終了」の日も同じフォームにあります。',
  // delete-booking
  'help.guide.delete-booking.title': '予約を削除する',
  'help.guide.delete-booking.goal': '流れてしまった予約を旅行から取り除きます。',
  'help.guide.delete-booking.step.1': 'カードの見出しにあるごみ箱をクリックします。',
  'help.guide.delete-booking.step.2': '「予約を削除しますか？」が選んだ予約の名前を示し、完全に削除されると伝えます。',
  'help.guide.delete-booking.step.3': '「確認」をクリックします。',
  'help.guide.delete-booking.result':
    'カードは旅行の全員から消えます。予約に取り消しはないので、この問いが最後の関門です。',
  'help.guide.delete-booking.tip.1':
    '宿泊の予約を削除すると、日別計画からその宿泊日も消え、結び付いていた支出も削除されます。',
  'help.guide.delete-booking.tip.2':
    '添付されていた書類は旅行の「ファイル」タブに残ります。消えるのは予約との結び付きだけです。',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    '見つかった予約はそれぞれ「新しい予約」に、内容が入った状態で順に開きます。ホテルなら「タイトル」に名前、旅行にその場所があれば「宿泊先」の下にその場所、「場所／住所」、宿泊日に合わせた「開始」と「終了」、「チェックイン」と「チェックアウト」、「予約コード」、「ファイル」の下に確認書、そして「費用」がオンなら「リンク済みの支出」として料金です。確かめて「追加」をクリックします。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '費用',
  'help.ctx.trip-costs.summary':
    '旅行のお金です。すべての支出が日付順の帳簿として並び、誰が立て替え、誰がその分を負担するのかが、レシートの通貨のまま記録されます。そして右の列には、誰が誰に払えば元どおり平らになるかが出ます。',
  'help.ctx.trip-costs.bullet.1':
    '上に4つのカードがあります。「支払う額」と「受け取る額」は精算におけるあなた自身の側、「未精算の金額」は記録済みでまだ支払者のいない分、「旅行の合計支出」はすべてを合計し、その下に「あなたの負担分」と「あなたが支払った額」を置きます。',
  'help.ctx.trip-costs.bullet.2':
    '右上の「支出を追加」でエディタが開きます。その隣の「精算する」は、未処理の送金をまとめて一度に記録します。',
  'help.ctx.trip-costs.bullet.3':
    '帳簿は日ごとにまとまり、新しい日が先に来て、その日の合計が右に出ます。行にはカテゴリが色付きのタブとして付き、名前、支払者のチップ、メモ、金額が並び、分割の結果あなたが貸し越しか借り越しになるときは「立て替えました」や「借りています」も付きます。',
  'help.ctx.trip-costs.bullet.4':
    'リストの上には「支出を検索…」、カテゴリのフィルター、日のフィルター、「すべて」／「自分が支払った分」／「受け取る分」の切り替え、そして「CSVを書き出し」ボタンがあります。',
  'help.ctx.trip-costs.bullet.5':
    '右の列が答えです。「精算する」は誰が誰に払うかを並べ、「残高」は旅行者ごとの過不足を示し、「最終負担額」は旅行が一人ひとりにいくらかかるかを、「カテゴリ別」はお金がどこへ行ったかを示します。',
  'help.ctx.trip-costs.bullet.6':
    '記録された支払いは同じ帳簿に独立した行として並び、隣に「編集」と「元に戻す」が付きます。支出には鉛筆とゴミ箱があり、ゴミ箱は確認なしで削除します。',
  // add-expense
  'help.guide.add-expense.title': '支出を追加する',
  'help.guide.add-expense.goal': '何にいくらかかったか、誰が支払ったか、誰と分け合うかを記録します。',
  'help.guide.add-expense.step.1':
    '「費用」タブの右上にある「支出を追加」をクリックします。エディタが今日の日付で開き、全員が最初から分割に入っています。',
  'help.guide.add-expense.step.2':
    '何の支出かを「何の支出ですか？」に入力します。入力が必須なのはこの欄だけです。レシートの数字は「合計金額」に入れます。',
  'help.guide.add-expense.step.3':
    '「通貨」と「日」は金額の下にあります。「通貨」は旅行そのものの通貨から始まります。変えると、その金額が旅行の通貨でいくらになるかをエディタが表示します。「日」は今日から始まり、帳簿はこの日で支出をまとめます。',
  'help.guide.add-expense.step.4':
    '「カテゴリ」を選びます。14種類あり、変更はできません。選んだものが行の色付きタブになり、「カテゴリ別」の棒になります。',
  'help.guide.add-expense.step.5':
    '「誰が支払いましたか？」で、実際にお金を出した人を選びます。「自分」があらかじめ選ばれています。「まだ誰も支払っていません」は、誰の負担にもせずに金額だけを記録します。「複数人が支払い」は、支払いを複数の支払者で分けます。',
  'help.guide.add-expense.step.6':
    'SplitはEquallyで始まり、全員が含まれた状態で、それぞれの名前に割り当てられる分が表示されます。「支出を追加」をクリックすると保存されます。',
  'help.guide.add-expense.result':
    '支出はその日の下の帳簿に入り、「旅行の合計支出」に算入され、精算の列は誰が誰に払うかを計算し直しています。',
  'help.guide.add-expense.tip.1':
    '開いたままにしておけば、支出は旅行の通貨、今日の日付、全員で均等に分割された状態です。本当に入力が要るのは名前と金額だけです。',
  'help.guide.add-expense.tip.2':
    '金額の横の±は、支出を返金に変えます。合計がマイナスならお金を取るのではなく返すことになり、分割も逆向きに働きます。',
  'help.guide.add-expense.tip.3':
    '下にある「レシート・請求書を添付」は画像とPDFを受け付けます。保存時にアップロードされ、旅行の「ファイル」に入り、リストの名前の横に「レシート」のチップが出ます。',
  // expense-payers
  'help.guide.expense-payers.title': '誰が代金を支払ったかを指定する',
  'help.guide.expense-payers.goal': 'ある支出で誰が立て替えているのかを記録します。精算の計算のもう半分です。',
  'help.guide.expense-payers.step.1':
    '行の横の鉛筆で支出を開き、「誰が支払いましたか？」を見ます。既定は「1人が支払い」で、プルダウンにはお金を出した一人の名前が入ります。',
  'help.guide.expense-payers.step.2':
    'そのプルダウンの最初の項目「まだ誰も支払っていません」は、誰にも負担を生じさせずに金額だけを記録します。支出は「旅行の合計支出」には算入されたままです。',
  'help.guide.expense-payers.step.3':
    'ラベルの横のリンク「複数人が支払い」は、旅行者ごとに1行を開きます。支払った人を追加し、それぞれがいくら出したかを入力します。金額は合計と一致している必要があります。',
  'help.guide.expense-payers.step.4':
    '誰も支払っていない支出は行に「未完了」の印が付き、「未精算の金額」カードに算入されます。記録はされたが精算されていない支出が集まる場所です。',
  'help.guide.expense-payers.result':
    '誰が支払ったかが誰に返されるかを決め、分割が誰が払うかを決めます。「残高」はその二つの差です。',
  'help.guide.expense-payers.tip.1':
    '「誰が支払いましたか？」とSplitは独立しています。出席しなかった夕食の代金を払うこともできますし、払っていない夕食の分割に入ることもできます。',
  'help.guide.expense-payers.tip.2':
    '支払者が複数のときは、金額が合計と一致している必要があります。もう一人追加すると、ほかの人の金額がそれに合わせて並び直ります。一致していない間は、いくらに合わせる必要があるかをエディタが伝え、保存を拒みます。',
  'help.guide.expense-payers.tip.3':
    '支払者を外しても支出は消えません。金額は「旅行の合計支出」に残り、行は「未完了」になります。',
  // split-expense
  'help.guide.split-expense.title': '旅行者どうしで代金を分ける',
  'help.guide.split-expense.goal':
    '支出を誰が負担するかを決めます。全員で均等に、金額で、あるいはレシートの1行ずつで。',
  'help.guide.split-expense.step.1':
    '支出エディタのSplitには、すべての旅行者が並びます。名前をクリックするとこの支出から外れます。外れた旅行者には「対象外」と表示され、その支出を負担しません。',
  'help.guide.split-expense.step.2':
    'Equallyが既定です。含まれている旅行者全員が同じ分を負担し、リストの下の行に何人で分けるのか、1人あたりいくらになるのかが出ます。',
  'help.guide.split-expense.step.3':
    'Customは、その分をそれぞれの金額欄に置き換えます。旅行者ごとの負担額を入力すると、下の行が合わせて数え、「分割は合計と一致しています」になると緑に変わります。一致していない間は保存されません。',
  'help.guide.split-expense.step.4':
    'Ticketはレシートを1行ずつ分けます。「品目を追加」を押し、行ごとに名前と価格を入れ、「分割:」の下にその行を分け合う旅行者を並べます。',
  'help.guide.split-expense.step.5':
    '行の下の「一人あたりの負担」には、旅行者ごとの最終的な負担額が出ます。上の「合計金額」は行から合計されます。「保存」をクリックします。',
  'help.guide.split-expense.result':
    '分割はすべての残高の土台です。支出と一緒に保存され、ほかに何も触れずに後から変えられます。',
  'help.guide.split-expense.tip.1':
    '外した旅行者には「対象外」と表示され、この支出だけは負担しません。その分はほかの人が引き受けます。',
  'help.guide.split-expense.tip.2':
    'Equallyは1セント単位まで正確です。余った1セントは支出ごとに順番に回るので、いつも同じ人が払うことにはなりません。',
  'help.guide.split-expense.tip.3':
    'Ticketモードでは「合計金額」が自動で合計され、欄は灰色になります。レシートの行が合計です。',
  // expense-currency
  'help.guide.expense-currency.title': '別の通貨で支出を入力する',
  'help.guide.expense-currency.goal': 'レシートに書かれているとおりに入力し、レートはTREKに預けます。',
  'help.guide.expense-currency.step.1':
    '「支出を追加」を開き、名前と金額をレシートのとおりに入力します。換算した値ではなく、その数字そのものです。',
  'help.guide.expense-currency.step.2':
    '「通貨」を開き、レシートの通貨を選びます。リストにはTREKが知っているすべてのコードが入っていて、検索できます。3文字を入力してください。',
  'help.guide.expense-currency.step.3':
    '欄の下に、その金額が今いくらになるかの行が出て、「リアルタイムレート」と示されます。これはプレビューで、保存される値ではありません。',
  'help.guide.expense-currency.step.4':
    '「支出を追加」をクリックします。レートはその場で固定されます。これ以降この支出は、入力した日の価値のままです。',
  'help.guide.expense-currency.step.5':
    '帳簿では、行の名前の下に両方の数字が並びます。入力した金額、矢印、そして旅行の通貨での金額です。上にあるすべての合計、残高、精算は二つ目を使います。',
  'help.guide.expense-currency.result':
    '支出は入力した金額と通貨を保ちます。帳簿は両方を表示し、旅行の合計と残高は旅行の通貨のままです。',
  'help.guide.expense-currency.tip.1':
    'レートは保存した瞬間に固定されるので、翌週に相場が動いたからといって精算済みの貸し借りが復活することはありません。新しいレートが固定されるのは、支出の通貨を変えたときだけです。',
  'help.guide.expense-currency.tip.2':
    '「設定」の「表示通貨」が変えるのは読む側だけで、保存された金額は動きません。空のままにすると、旅行はそれぞれ自分の通貨で表示されます。',
  'help.guide.expense-currency.tip.3':
    '旅行の通貨そのものは旅行側にあり、「旅行を編集」の下にあって、「旅行詳細を編集」の権限が要ります。変更すると、固定された各レートの基準が取り直され、金額が別の通貨に置き換わるわけではありません。',
  // filter-costs
  'help.guide.filter-costs.title': '支出を探す、または1日の出費を見る',
  'help.guide.filter-costs.goal': '長い帳簿を、実際に探しているものまで絞り込みます。',
  'help.guide.filter-costs.step.1': 'リストの上の「支出を検索…」に入力します。入力に合わせて支出の名前を照合します。',
  'help.guide.filter-costs.step.2':
    '「すべてのカテゴリー」を開くと14のカテゴリが出ます。一つ選ぶと、そのカテゴリの支出だけが残ります。',
  'help.guide.filter-costs.step.3':
    '「すべての日」には、何かを使った日がすべて並びます。一つ選ぶと、日の見出しの代わりにバナーが出て、その日と、そこに含まれる支出の件数と、その合計が表示されます。',
  'help.guide.filter-costs.step.4':
    '「すべて」／「自分が支払った分」／「受け取る分」の切り替えは、あなた自身から見た帳簿です。あなたがお金を出したもの、そしてまだ返ってきていないものが分かります。',
  'help.guide.filter-costs.step.5':
    '行の末尾の「CSVを書き出し」は、すべての支出をファイルに書き出します。元の金額、その通貨、換算後の金額が入ります。',
  'help.guide.filter-costs.result':
    'フィルターは組み合わさり、日ごとのまとまりは残ったものだけの合計で描き直されます。',
  'help.guide.filter-costs.tip.1':
    '記録された支払いには名前もカテゴリもないので、検索やカテゴリのフィルターでは隠れます。日のフィルターは、支払いが記録された日の下にそれを残します。',
  'help.guide.filter-costs.tip.2':
    '「CSVを書き出し」は画面で何を絞り込んでいても、常にすべての支出を、1支出につき1行で書き出します。',
  // settle-up
  'help.guide.settle-up.title': '誰が誰に払うかを出して精算する',
  'help.guide.settle-up.goal':
    '積み上がった共同の支出を、全員が平らになる最少の送金に変え、実際に行われたとおり記録します。',
  'help.guide.settle-up.step.1':
    '右の列の「精算する」カードには、全員が平らになる送金が並びます。誰が誰に、いくら払うかです。見出しの横の数字は、まだ未処理の件数です。',
  'help.guide.settle-up.step.2':
    '送金の横の「精算」は、それを実行済みとして記録します。その流れはカードから消え、残高が描き直されます。',
  'help.guide.settle-up.step.3':
    '記録された送金は帳簿の行になり、それが行われた日の下に、「支払い」の印と二人の旅行者、金額とともに並びます。',
  'help.guide.settle-up.step.4':
    'その行の横で、鉛筆は支払いを修正し、「元に戻す」は取り消します。取り消すと、送金は「精算する」カードに戻ります。',
  'help.guide.settle-up.step.5':
    'カードの見出しの「支払いを追加」は、提案に沿わなかった送金を記録します。「支払元」と「支払先」、金額、その通貨、そして行われた日を選びます。',
  'help.guide.settle-up.step.6':
    '画面上部のヘッダーにある「精算する」は、未処理の送金をまとめて一度に記録します。旅行の終わりにみんなで清算するときのやり方です。',
  'help.guide.settle-up.result':
    '記録された送金はすべて帳簿の行になり、「精算する」カードから1行減ります。カードに「全員が清算済みです」と出れば、旅行の支払いは終わりです。',
  'help.guide.settle-up.tip.1':
    'カードが示すのは最少の送金であって、すべての貸し借りではありません。3人が輪になって貸し借りしていれば、1回か2回の支払いにまとまります。',
  'help.guide.settle-up.tip.2':
    '「精算」は送金を記録するだけで、お金を動かしはしません。いつもの手段で送ってから、クリックしてください。',
  'help.guide.settle-up.tip.3':
    '支払いはどの通貨でもできるので、円の借りをユーロで返すのも普通のことです。ダイアログには専用の通貨の選択欄があり、そのレートも固定します。',
  // final-budget
  'help.guide.final-budget.title': '旅行が旅行者ごとにいくらかかったかを見る',
  'help.guide.final-budget.goal': '帳簿の一人あたりの側を読みます。今日の残高と、一人あたりの実際の費用です。',
  'help.guide.final-budget.step.1':
    '「残高」には旅行者ごとの位置が出ます。旅行がその人に返す側なら右へ伸びる緑の棒、その人が旅行に払う側なら左へ伸びる赤の棒が出て、名前の横に金額が並びます。',
  'help.guide.final-budget.step.2':
    'その下の「最終負担額」は別の問いに答えます。今誰が何を負担しているかではなく、すべてが返し終わったときに旅行が旅行者ごとにいくらかかるのかです。',
  'help.guide.final-budget.step.3':
    '名前をクリックすると計算が開きます。「支払った費用」、そしてその下に「精算（差引）」と「未精算の金額」が並びます。',
  'help.guide.final-budget.step.4':
    'それぞれの行の下には、その行を作っている明細が並びます。その旅行者が支払った支出、すでに記録された送金、まだ未処理の送金です。合計は上の行とぴったり一致します。',
  'help.guide.final-budget.result':
    '「残高」は今日の時点で誰が貸し越しか借り越しか、「最終負担額」はすべてを返し終えたあとに旅行が一人ひとりにいくらかかるかです。',
  'help.guide.final-budget.tip.1':
    '支払いを記録しても、誰の最終負担額も変わりません。金額が未精算の分から精算（差引）へ移るだけです。',
  'help.guide.final-budget.tip.2':
    '支払者のいない支出は、精算の提案から外れるのと同じく、どちらのカードにも入りません。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '予約を支出に変える',
  'help.guide.expense-from-booking.goal':
    '航空券やホテル、場所に実際にかかった費用を、それが属する記録そのものに付けます。',
  'help.guide.expense-from-booking.step.1': '「移動」タブか「予約」タブで予約を開き、その鉛筆をクリックします。',
  'help.guide.expense-from-booking.step.2':
    'フォームの一番下の「費用」のブロックまでスクロールします。先に予約を保存する「支出を作成」と、すでに「費用」にある支出のための「既存の支出をリンク」が出ています。',
  'help.guide.expense-from-booking.step.3':
    '「支出を作成」をクリックします。予約が保存され、フォームが閉じ、予約のタイトルを名前として、種類に合うカテゴリがすでに当てられた状態で費用のエディタが開きます。',
  'help.guide.expense-from-booking.step.4':
    'ほかの支出と同じように金額とその通貨、支払った人、分割を入力して保存します。予約を開き直すと、「リンク済みの支出」の下にそれが出て、編集する鉛筆、紐づけだけを外す「リンクを解除し、支出は残す」、削除するゴミ箱が付きます。',
  'help.guide.expense-from-booking.result':
    '予約はその費用を持ち、支出は「費用」タブのふつうの行になります。ほかの支出と同じく、支払者と分割と通貨を持ちます。',
  'help.guide.expense-from-booking.tip.1':
    '予約を削除すると、紐づいた支出も一緒に消えます。予約の「費用」ブロックにある「支出を削除」はその逆で、支出が消えて予約は残ります。「リンクを解除し、支出は残す」なら両方とも残ります。',
  'help.guide.expense-from-booking.tip.2':
    '場所のフォームにも同じブロックがあり、「支出を作成」は先に場所を保存します。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '移動',
  'help.ctx.trip-transports.summary':
    '立ち寄り先の間を運んでくれるものすべてです。航空便、列車、バス、レンタカー、タクシー、自転車、クルーズ、フェリー、そして TREK が調べてくれる公共交通機関の経路。タブはその一覧で、計画の上でも作成して読むことができ、地図にも描かれます。',
  'help.ctx.trip-transports.bullet.1':
    'タブに入るのは移動だけです。宿泊、レストラン、イベント、チケットは「予約」にあるので、同じ項目が二度出ることはありません。',
  'help.ctx.trip-transports.bullet.2':
    'ツールバーは「すべて」ですべてを数え、使われている種類ごとに自分の件数を持つチップを与えます。「航空便」「列車」「レンタカー」「公共交通機関」です。右の「交通」は手動で一つ追加します。',
  'help.ctx.trip-transports.bullet.3':
    'カードは三つのグループに分かれ、どれも見出しから畳めます。検索が計画した経路の「公共交通機関の自動検索」、次に「保留」、次に「確定」です。',
  'help.ctx.trip-transports.bullet.4':
    'カードはステータス、種類、またがる日、時刻、「予約コード」、経路、そして「航空会社」と「便名」、または「列車番号」「ホーム」「座席」を載せます。鉛筆が開き、ごみ箱が確認のうえで削除します。',
  'help.ctx.trip-transports.bullet.5':
    '移動手段は計画の上でも作れます。どの日のヘッダーにも「移動手段を追加」の + と「公共交通機関」の路面電車ボタンがあり、二つの立ち寄り先の間の移動時間コネクタは、その区間だけの同じ検索を開きます。',
  'help.ctx.trip-transports.bullet.6':
    '両端が設定された移動手段は地図に線を描きます。日程内のその行にあるルートアイコンがその線を表示し、日の上のツールバーにある「すべての予約ルートを表示」は旅行全体を切り替えます。',
  // transports-list
  'help.guide.transports-list.title': '「移動」タブを読む',
  'help.guide.transports-list.goal': '何かを変える前に、一覧が何を伝えているかを知ります。',
  'help.guide.transports-list.step.1':
    '「移動」は旅行の二番目のタブです。入るのは移動だけで、ホテル、レストラン、イベント、チケットは「予約」にあります。',
  'help.guide.transports-list.step.2':
    'ツールバーはすべての移動手段を「すべて」で数え、使われている種類ごとに自分の件数を持つチップを与えます。チップをクリックするとその種類だけが残り、もう一度クリックすると外れます。複数のチップを同時に有効にでき、「すべて」がそれらを解除します。',
  'help.guide.transports-list.step.3':
    '「公共交通機関の自動検索」は独立したグループで、公共交通機関の検索が計画した経路です。「保留」と「確定」には手で入力したものがすべて入ります。見出しの隣の矢印がグループを畳みます。',
  'help.guide.transports-list.step.4':
    'カードがすべてを語ります。「保留」または「確定」のステータスドット、種類、またがる日とその日付、時刻、「予約コード」、経路、そして「航空会社」と「便名」、または「列車番号」「ホーム」「座席」です。',
  'help.guide.transports-list.step.5':
    '鉛筆は移動手段を編集のために開き、ごみ箱は、何が消えるかを示す確認のあとで削除します。',
  'help.guide.transports-list.result': '一覧は探していたものに絞られ、どのカードも一目で予約済みかどうかを伝えます。',
  'help.guide.transports-list.tip.1':
    'チップと畳んだグループは旅行ごとに記憶されるので、タブは離れたときのまま開き直します。',
  'help.guide.transports-list.tip.2':
    '「ファイルからインポート」と AirTrail がツールバーの「交通」に加わるのは、サーバーが予約確認書を読めるとき、そして AirTrail のインスタンスが接続されているときだけです。それがなければ、一覧は手入力と公共交通機関の検索で埋まります。',
  // add-transport
  'help.guide.add-transport.title': '日に移動手段を追加する',
  'help.guide.add-transport.goal': '一つの立ち寄り先から次へ運んでくれる移動を、それが起きる日に入れます。',
  'help.guide.add-transport.step.1':
    'どの日のヘッダーにも右に小さなボタンが四つあります。ツールチップに「移動手段を追加」と出る + をクリックします。フォームが開き、「日付」はすでにその日になっています。',
  'help.guide.add-transport.step.2':
    '「予約タイプ」は何に乗るかを選びます。「航空便」「列車」「バス」「レンタカー」「タクシー」「自転車」「クルーズ」「フェリー」「その他」です。フォームはそれに従います。航空便は区間ごとに空港を、列車は駅の連なりを、レンタカーは「受取」と「返却」という言い方と「途中の立ち寄り先」を得ます。',
  'help.guide.add-transport.step.3':
    '「タイトル」だけは必ず埋める必要があり、なければ「追加」は灰色のままです。発車標で見て分かるものを書きます。',
  'help.guide.add-transport.step.4':
    '「出発地」と「到着地」は駅、港、住所を検索します。三文字以上入力して一覧から結果を選びます。入力しただけの名前は座標を持たないので、地図には何も描かれません。',
  'help.guide.add-transport.step.5':
    '「日付」と「開始時刻」はいつ動くかを、「終了日」と「終了時刻」はいつ終わるかを示します。翌日に着く移動は終わりに翌日を取ります。「予約コード」、「保留」または「確定」の「ステータス」、「メモ」は任意です。',
  'help.guide.add-transport.step.6': '「追加」をクリックします。',
  'help.guide.add-transport.result':
    '移動手段はその日の行になり、立ち寄り先の間のその時刻に並び、「移動」タブでは「保留」または「確定」の下のカードになります。',
  'help.guide.add-transport.tip.1':
    '行は開始時刻が決める場所、つまりそれより早く始まる最後の立ち寄り先の後に着きます。つまみで日の中の別の場所へも、別の日へもドラッグできます。',
  'help.guide.add-transport.tip.2':
    '「ファイル」の下の「ファイルを添付」がチケットを受け取り、「費用」の下の「支出を作成」は予約を保存して運賃のために「費用」のエディターを開きます。',
  'help.guide.add-transport.tip.3':
    '「同行者」はこの移動に誰が乗るかを記します。一つの移動手段に同行者が付くとすぐ、タブのツールバーにその人たちのアバターが増え、一覧をそれで絞り込みます。',
  // plan-transit
  'help.guide.plan-transit.title': '公共交通機関の経路を計画する',
  'help.guide.plan-transit.goal': 'その日の二点の間の実際の列車やバスを TREK に調べさせ、選んだものを計画に入れます。',
  'help.guide.plan-transit.step.1':
    '日のヘッダーで路面電車ボタン、「公共交通機関」をクリックします。その日の検索が開きます。',
  'help.guide.plan-transit.step.2':
    '「出発地」と「目的地」は停留所または駅を取ります。欄が空のままならその日自身の立ち寄り先と旅行の宿泊先が示され、二文字入力すると代わりに時刻表の駅を検索します。二つの欄の間の「入れ替え」は経路を逆向きにします。',
  'help.guide.plan-transit.step.3':
    '「出発」または「到着」と時刻がいつ移動したいかを示し、「おすすめルート」「乗り換え少」「徒歩少」が答えの並べ方を示します。',
  'help.guide.plan-transit.step.4':
    '下のチップはどの手段を使ってよいかを示します。「電車」「地下鉄」「路面電車」「バス」「フェリー」「ケーブルカー」です。一つをオフにすると除外され、少なくとも一つは有効なままです。そして「検索」をクリックします。',
  'help.guide.plan-transit.step.5':
    '各結果は発着時刻、所要時間、乗り換え回数、徒歩の量、そして各路線をそれぞれの色で示します。一つをクリックすると駅ごとに展開し、ホームと路線間の徒歩も出ます。',
  'help.guide.plan-transit.step.6': '「日程に追加」をクリックします。',
  'help.guide.plan-transit.result':
    '経路はその日の行になり、路線、乗り換え、徒歩時間を伴い、「移動」タブでは「公共交通機関の自動検索」の下のカードになります。',
  'help.guide.plan-transit.tip.1':
    '経路は Transitous から来ます。公開時刻表データの上に立つ無料のコミュニティサービスで、キーもアカウントも要りません。管理者は検索を代わりに Google に向けることもできます。',
  'help.guide.plan-transit.tip.2':
    '何も見つかりませんか。フィードは地域と期間を覆っています。別の時刻を試すか、手段をもっとオンにするか、場所そのものではなく駅を選んでください。メッセージは答えたサービスの名前を示します。',
  'help.guide.plan-transit.tip.3':
    '同じ検索は一区間にも開きます。二つの立ち寄り先の間の移動時間コネクタをクリックして「公共交通機関」を選びます。「出発地」「目的地」と出発時刻は入力済みです。',
  // change-transit-route
  'help.guide.change-transit-route.title': '計画された経路を開いて変える',
  'help.guide.change-transit-route.goal': '経路を駅ごとに読み、名前を変え、あるいは経路を調べ直します。',
  'help.guide.change-transit-route.step.1':
    '「移動」タブでは、計画された経路は「公共交通機関の自動検索」の下にあります。カードをクリックします。',
  'help.guide.change-transit-route.step.2':
    '上に「所要時間」「乗り換え」「徒歩」があります。その下の「行程」が経路を駅ごとにたどり、ホームと路線間の徒歩も示します。',
  'help.guide.change-transit-route.step.3':
    '「経路を変更」は検索をもう一度実行します。この経路の両端とその日はすでに入っています。',
  'help.guide.change-transit-route.step.4':
    '別の経路を選んで「日程に追加」をクリックすると、古いものに取って代わります。「経路を変更」の隣の「詳細を編集」は代わりに通常の移動手段フォームを開き、そこに「予約コード」「ステータス」、同行者、ファイルがあります。',
  'help.guide.change-transit-route.result':
    '経路は新しい行程を持ち、「移動」タブのそのカードは新しい路線と時刻を示します。',
  'help.guide.change-transit-route.tip.1':
    '経路のタイトルはただのテキストです。隣の鉛筆は経路に触れずに名前を変えます。下の「メモ」は markdown を受け取り、「編集」と「プレビュー」のタブがあります。',
  'help.guide.change-transit-route.tip.2':
    '経路の下部の「削除」はその経路を旅行から外します。日は立ち寄り先をそのまま保ちます。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '一区間の移動方法を変える',
  'help.guide.leg-travel-mode.goal': 'ほかは車で進む日の一区間だけを歩くか、その区間を公共交通機関の検索に任せます。',
  'help.guide.leg-travel-mode.step.1':
    '立ち寄り先の間のコネクタは、その日のルートを表示して初めて現れます。日をクリックして開き、立ち寄り先の下の「ルート」を押します。',
  'help.guide.leg-travel-mode.step.2':
    '各コネクタはその区間の移動時間と距離を示し、経路を計算した手段のアイコンを添えます。運転なら車、徒歩なら足です。',
  'help.guide.leg-travel-mode.step.3':
    'コネクタをクリックします。メニューには「車」と「徒歩」、「公共交通機関」、「1日のデフォルトを使用」があります。',
  'help.guide.leg-travel-mode.step.4':
    '「徒歩」を選びます。変わるのはこの区間だけで、その日の残りは自分の手段を保ちます。',
  'help.guide.leg-travel-mode.result': '区間は足のアイコンと徒歩時間を示し、その日のほかの区間は日の手段を保ちます。',
  'help.guide.leg-travel-mode.tip.1':
    '手段は日ではなく区間のものです。日全体の「車」と「徒歩」のボタンは、手で設定した区間を決して上書きしません。「1日のデフォルトを使用」が区間をそれらに返します。',
  'help.guide.leg-travel-mode.tip.2':
    '同じメニューの「公共交通機関」は、まさにこの区間の経路検索を開き、両端と出発時刻はすでに入っています。',
  'help.guide.leg-travel-mode.tip.3':
    '時間は実際の道路と歩道の上で動く公開のルーターから来ます。答えられない区間は直線のままで、時間を表示しません。',
  // edit-transport
  'help.guide.edit-transport.title': '移動手段を変える、または削除する',
  'help.guide.edit-transport.goal': '時刻、ホーム、予約コードを直すか、その移動を旅行から外します。',
  'help.guide.edit-transport.step.1': '日程では移動手段は立ち寄り先の間の色付きの行です。それをクリックします。',
  'help.guide.edit-transport.step.2':
    'フォームはそれを作ったものと同じで、タイトルバーに「移動手段を編集」と出ます。すべて変えられます。種類、経路、日と時刻、「予約コード」、「ステータス」です。',
  'help.guide.edit-transport.step.3':
    '航空便の経路は空港の連なり、列車の経路は駅の連なりです。「経由地を追加」は間にもう一つ置き、各区間は自分の時刻と自分の便名または列車番号を保ちます。',
  'help.guide.edit-transport.step.4':
    '「更新」をクリックします。移動手段をすっかり取り除くには、「移動」タブのそのカードのごみ箱を使って確認します。',
  'help.guide.edit-transport.result':
    '変更は移動手段が現れるすべての場所に出ます。「移動」タブ、それが動く日、そして地図上のその線です。',
  'help.guide.edit-transport.tip.1':
    '同じフォームは両側から開きます。「移動」タブのカードの鉛筆と、日程にある移動手段自身の行です。計画された公共交通機関の経路だけは例外で、その行は経路の画面を開き、そこの「詳細を編集」がこのフォームへ導きます。',
  'help.guide.edit-transport.tip.2':
    '移動手段を別の日へ動かすのにフォームは要りません。行をある日のカードから次のカードへドラッグします。',
  // transport-on-map
  'help.guide.transport-on-map.title': '移動手段を地図に描く',
  'help.guide.transport-on-map.goal': '航空便、車での移動、経路が実際にどこを通るかを見ます。',
  'help.guide.transport-on-map.step.1':
    '両端が設定された移動手段は、日程のその行に小さなルートアイコンを持ちます。クリックすると、そのラベルは「予約ルートを非表示」に変わります。',
  'help.guide.transport-on-map.step.2': '経路が地図に描かれ、両端に移動手段のアイコンを載せた丸いマーカーが付きます。',
  'help.guide.transport-on-map.step.3':
    '端のマーカーをクリックすると、地図を離れずに予約を読めます。時刻、「航空会社」と「便名」、「予約コード」、そして「住所」です。「閉じる」がシートを片付けます。',
  'help.guide.transport-on-map.step.4':
    '日の上のツールバーのルートアイコンは旅行全体を一度に扱います。「すべての予約ルートを表示」と、また消すための「すべての予約ルートを非表示」です。',
  'help.guide.transport-on-map.step.5':
    '計画された公共交通機関の経路は自分のアイコンを持ちません。その日の「ルート」の切り替えで描かれるので、その日のルートが表示されている間は「すべての予約ルートを非表示」でも消えません。',
  'help.guide.transport-on-map.result':
    'ルートは両端にマーカーを付けて地図に載り、もう一度オフにするまでそこに残ります。',
  'help.guide.transport-on-map.tip.1':
    '航空便、クルーズ、フェリーは曲線で描かれ、レンタカー、バス、タクシー、自転車は実際の道路をたどり、列車や計画された経路は停車する駅を通ります。',
  'help.guide.transport-on-map.tip.2':
    '「確定」の予約は実線、「保留」の予約は破線です。「予約ルートのラベル」の設定は、空港コードまたは駅名を端のマーカーに書き込みます。',
  'help.guide.transport-on-map.tip.3':
    '「すべての予約ルートを表示」は重ねる層ではなく白紙からの始まりです。個々のアイコンが設定したものを捨てるので、二度押すとすべて表示かすべて非表示のどちらかになります。',
  // import-transport-file
  'help.guide.import-transport-file.title': 'e チケットからフライトを読み取る',
  'help.guide.import-transport-file.goal':
    '運航会社が送ってきたチケットから、TREK にフライト、列車、フェリーを取り出させ、保存する前に確かめます。',
  'help.guide.import-transport-file.step.1':
    '「移動」タブのツールバー、「交通」の隣にある「ファイルからインポート」をクリックします。「予約」タブと同じダイアログ、「予約確認書のインポート」が開きます。',
  'help.guide.import-transport-file.step.2':
    'チケットを枠にドロップするか、枠をクリックして選びます。EML、PDF、PKPass、HTML、TXT が使え、1ファイル 10 MB まで、最大 5 ファイルです。選んだファイルの名前が枠に出ます。',
  'help.guide.import-transport-file.step.3':
    '「インポート」をクリックします。ダイアログはすぐに閉じ、読み取りは背後で進みます。',
  'help.guide.import-transport-file.step.4':
    '右下のカードがファイル名の下で処理の様子を伝えます。読み取りが終わると「ファイルを解析中…」がチェックマークに変わり、カードが「インポート」を示します。それをクリックします。',
  'help.guide.import-transport-file.step.5':
    'フライトが「移動手段を追加」に、内容が入った状態で開きます。「予約タイプ」は「航空便」、「タイトル」に航空会社と便名、「経路」の下に「出発」と「到着」の2つの空港、その時刻とタイムゾーン、「航空会社」と「便名」、「予約コード」、そして「ファイル」の下にチケットです。確かめて「追加」をクリックします。',
  'help.guide.import-transport-file.result':
    'フライトは「移動」タブの「保留」のカードになり、出発する日の行になります。「ファイル」の下にチケットがあり、両方の空港が分かっていれば地図に弧を描きます。',
  'help.guide.import-transport-file.tip.1':
    '2つのタブは1つのインポートを共有します。フライトとホテルを含むファイルは、どちらのタブから始めても、フライトを「移動手段を追加」に、ホテルを「新しい予約」に順に開きます。',
  'help.guide.import-transport-file.tip.2':
    '空港はコードで配置されます。読み取りが位置を特定できなかった駅や港はカードに琥珀色で示されます。「追加」をクリックする前に「経路」の下で手で選んでください。そうしないと、その移動手段は地図に何も描きません。',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail からフライトをインポートする',
  'help.guide.airtrail-import.goal':
    'AirTrail にすでに保存しているフライトを一度に旅行へ持ち込み、以後は AirTrail に従わせます。',
  'help.guide.airtrail-import.step.1':
    'AirTrail アドオンがオンで、「設定」の「連携」であなたのインスタンスが接続されていると、「移動」タブのツールバーに「交通」の隣の「AirTrail」ボタンがあります。クリックします。',
  'help.guide.airtrail-import.step.2':
    '「AirTrail からインポート」は、あなたのアカウントのフライトを2つのグループで一覧します。「この旅行の期間中」には旅行の期間内の日付のものが、チェックが付いた状態で入り、「その他のフライト」には残りが、チェックなしで入ります。すでに旅行にあるフライトは灰色になり、「インポート済み」の印が付きます。',
  'help.guide.airtrail-import.step.3':
    '各行は、航空会社と便名、2つの空港、日付を持つチェックボックスです。行をクリックしてフライトを入れるか外すかを決めます。「その他のフライト」の下のものは、チェックを付けたときだけ入ります。',
  'help.guide.airtrail-import.step.4':
    'つながるフライト、つまりそれぞれが前のフライトの着陸した空港から1日以内に出発するものは、一緒に枠で囲まれます。その下のチェック、その空港の名前を入れた「…での乗り継ぎを含む1つのフライトとしてインポート」は最初からオンです。乗り継ぎのある1つの予約にするならオンのままにし、区間を別々のフライトとしてインポートするならオフにします。',
  'help.guide.airtrail-import.step.5':
    '「インポート」をクリックします。ボタンはチェックの付いたフライトを数え、あとのメッセージが何件入ったかを伝えます。',
  'help.guide.airtrail-import.step.6':
    'フライトは「確定」の下のカードになり、それぞれステータスの隣に青い AirTrail バッジを持ち、運航する日の行になります。結合した乗り継ぎは1枚のカードで、経路は乗り継ぎ地を通ります。',
  'help.guide.airtrail-import.result':
    'AirTrail からのフライトは「移動」タブのカードとその日の行になり、それぞれがどこから来たかを伝える AirTrail バッジを付けています。',
  'help.guide.airtrail-import.tip.1':
    '同じ便名と日付ですでに旅行にあるフライトは飛ばされ、メッセージが何件だったかを伝えます。日程の上のツールバーにある「元に戻す」がインポート全体を取り消します。',
  'help.guide.airtrail-import.tip.2':
    'AirTrail が引き続き正しい情報の源です。TREK は旅行を開いたときと、背後で数分ごとにその変更を読みます。向こうで削除されたフライトはカードを保ち、バッジは「未同期」に変わります。TREK での編集が向こうへ戻るのは、「連携」の「変更を AirTrail に書き戻す」がオンのときだけです。',
  'help.guide.airtrail-import.tip.3':
    '結合した乗り継ぎには従うべき単一の AirTrail フライトがないので、一度きりのインポートです。青いバッジは保たれ、バッジにポインターを重ねるとそう伝えます。同期されたフライトに手で経由地を与えたときも同じことが起きます。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'ロードトリップ',
  'help.ctx.trip-roadtrip.summary':
    '計画を1本の運転として読むところです。同じ日と同じ場所が、あいだの運転とともに立ち寄り先としてつながり、左の列を下る行程の一覧と地図に並びます。どれだけの距離と時間がかかるか、燃料がどこで尽きるか、道沿いに何があるかを示します。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左の列の上にある「日ごと」と「ロードトリップ」が、日別の計画と運転を切り替えます。何も複製されず、何も変わりません。「日ごと」は計画をそのままの形で返します。',
  'help.ctx.trip-roadtrip.bullet.2':
    '行程の一覧の先頭は旅行全体を合計します。「距離」「運転時間」「立ち寄り先」です。その下には1日に1枚のカードが並び、その日ぶんの距離、いくつの立ち寄り先のための日か、何を超過しているか、そして「トラック」のバッジが出ます。',
  'help.ctx.trip-roadtrip.bullet.3':
    '番号の付いた立ち寄り先は、その日が目指す場所です。途中の立ち寄り、給油や充電やサービスエリアは、番号ではなく種類のアイコンを身に着け、数に入りません。番号をクリックすると種類を変えられ、「滞在」のバッジをクリックすると、どれだけかかるかを指定できます。',
  'help.ctx.trip-roadtrip.bullet.4':
    '2つの立ち寄り先のあいだでは、運転の帯が区間を距離と時間で示します。クリックすると「この区間の走り方」が開き、地図上の描かれたルートをクリックすると、経由地を通して区間を曲げられます。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右の列は「ルート沿い」になります。日と、探すものと、回廊の幅を選び、「検索」を押します。「追加」は、実際に通過する地点で結果を運転に載せます。',
  'help.ctx.trip-roadtrip.bullet.6':
    'その下の「運転の設定」には、上限、車とその航続、毎日の移動時間、避けるもの、線の描き方が入っています。これらは旅行に属するので、全員が同じ車で計画します。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '旅行を1本の運転として読む',
  'help.guide.roadtrip-mode.goal': '計画をロードトリップモードに切り替え、行程の一覧が伝えることを読み取ります。',
  'help.guide.roadtrip-mode.step.1':
    '左の列の上にある「日ごと」と「ロードトリップ」の切り替えで「ロードトリップ」をクリックします。日別の計画が運転に置き換わり、ルートの出ているすべての日が地図に描かれます。',
  'help.guide.roadtrip-mode.step.2': '行程の一覧の先頭は旅行全体を合計します。「距離」「運転時間」「立ち寄り先」です。',
  'help.guide.roadtrip-mode.step.3':
    'その下には1日に1枚のカードが並びます。ヘッダーには日の番号と日付、距離と時間で表した運転、そしてその日がいくつの立ち寄り先のためのものかが出ます。',
  'help.guide.roadtrip-mode.step.4':
    'カードの中で、その日は鎖になっています。場所ごとに番号の付いた立ち寄り先、対ごとに運転の帯、そして右端に到着時刻です。',
  'help.guide.roadtrip-mode.step.5':
    '日のヘッダーをクリックするとたたまれます。たたまれた日は地図からも消えます。もう一度ヘッダーをクリックすると戻ります。',
  'help.guide.roadtrip-mode.result':
    '左の列が運転になり、地図はそのすべての日を表示します。「日ごと」はそのまま計画に戻し、計画は変わりません。',
  'help.guide.roadtrip-mode.tip.1':
    'この選択はブラウザーのタブが開いているあいだ旅行ごとに覚えられるので、再読み込みしても運転に戻ります。',
  'help.guide.roadtrip-mode.tip.2':
    '切り替えは、管理者が「管理」の「アドオン」で「ロードトリップ」アドオンを有効にして初めて現れます。',
  'help.guide.roadtrip-mode.tip.3':
    'スマートフォンには切り替えがありません。アドオンが「計画」の隣に専用の「ロードトリップ」タブを足します。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中の立ち寄りと、滞在の長さ',
  'help.guide.roadtrip-stops.goal': '運転上の場所を途中の立ち寄りに変え、それぞれの立ち寄りにかかる時間を決めます。',
  'help.guide.roadtrip-stops.step.1':
    '行程の一覧で、立ち寄り先の前にある番号をクリックします。ラベルは「途中の立ち寄りにする」で、「立ち寄りの種類」が開きます。',
  'help.guide.roadtrip-stops.step.2':
    '種類を選びます。「宿泊施設」「給油」「充電」「サービスエリア」「キャンプ場」「食事」「見どころ」です。番号はその種類のアイコンに変わり、それより下の立ち寄り先は番号を振り直されます。',
  'help.guide.roadtrip-stops.step.3':
    '途中の立ち寄りは目的地ではないので、その日のヘッダーは立ち寄り先を1つ少なく数えます。',
  'help.guide.roadtrip-stops.step.4':
    'もう一度アイコンをクリックして「立ち寄りの種類を変更」を開き、「目的地に戻す」を選ぶと、立ち寄り先に番号が戻ります。',
  'help.guide.roadtrip-stops.step.5':
    'どの立ち寄り先にも「滞在」のバッジが付いています。クリックすると「この立ち寄り先での滞在時間」が開きます。',
  'help.guide.roadtrip-stops.step.6':
    '長さはスライダー、マイナスとプラスのボタン、または用意された候補のどれかで決めます。「到着」と「出発」がどう動くかを見て、「保存」をクリックします。',
  'help.guide.roadtrip-stops.result':
    '時間を決めた立ち寄り先は「滞在」バッジにその時刻を載せ、それより後の到着はすべて一緒に動いています。そして、種類に送って戻した立ち寄り先は、また番号付きの目的地です。',
  'help.guide.roadtrip-stops.tip.1':
    '滞在は1回の訪問ではなく場所に属します。2つの日に計画された場所は、どちらの日でも同じだけ立ち止まります。',
  'help.guide.roadtrip-stops.tip.2':
    '途中の立ち寄りは「日ごと」にも出ます。「運転の設定」の「サービス施設での停車」にある「日別にも表示」をオフにすると、「ロードトリップ」だけに残ります。',
  'help.guide.roadtrip-stops.tip.3': '同じダイアログの「滞在なし」で、時間をまた取り除けます。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'ルート沿いで給油、食事、宿を見つける',
  'help.guide.roadtrip-corridor.goal': '実際に走る道を検索し、見つけたものを正しい区間に置きます。',
  'help.guide.roadtrip-corridor.step.1': '「ルート沿い」の上で日を選びます。ルートの出ている日だけが示されます。',
  'help.guide.roadtrip-corridor.step.2':
    '「探すもの」で必要なものにチェックを入れます。「宿泊施設」「給油」「充電」「サービスエリア」「キャンプ場」「食事」「見どころ」は組み合わせられます。',
  'help.guide.roadtrip-corridor.step.3':
    '「範囲」で道の両側どこまで探すかを、2 km、5 km、10 km から選び、「検索」をクリックします。',
  'help.guide.roadtrip-corridor.step.4':
    '結果は種類ごとにまとまり、通過する順に返ります。それぞれに、その日のどのあたりにあるか、ルートからどれだけ離れているかが付きます。',
  'help.guide.roadtrip-corridor.step.5':
    '結果の「追加」は「立ち寄り先として追加」を開きます。どの日の何番目に入るかを示し、種類と立ち寄りの時間を尋ね、「追加」が運転に載せます。',
  'help.guide.roadtrip-corridor.result':
    '結果は通過する順に並んで地図に描かれ、追加したものは実際に通過する地点で運転の上に載ります。',
  'help.guide.roadtrip-corridor.tip.1':
    '「検索」を押すまで何も検索されません。1回の実行は共有サービスへの多くのリクエストだからです。',
  'help.guide.roadtrip-corridor.tip.2':
    '「名前で絞り込む」は返ってきたものを聞き直さずに絞り、「結果を消去」は一覧とそのピンを空にします。結果をクリックすると地図に表示されます。',
  'help.guide.roadtrip-corridor.tip.3':
    '結果は地図から描かれたルートへドラッグすることもできます。同じ道を二度走る場合に、自分で区間を選ぶ方法です。「検索」の隣の「手動で追加」は、代わりに名前で場所を調べます。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '経由地で区間を曲げる',
  'help.guide.roadtrip-via.goal': '立ち寄り先を足さずに、区間を本当に通りたい道へ送ります。',
  'help.guide.roadtrip-via.step.1':
    '目的の区間を表示します。行程の一覧で立ち寄り先をクリックし、地図の上に開いたカードを閉じます。',
  'help.guide.roadtrip-via.step.2':
    '描かれたルートをクリックします。クリックした区間に経由地が落ち、その区間は経由地を通って引き直されます。',
  'help.guide.roadtrip-via.step.3':
    '行程の一覧が従います。その日のヘッダーには新しい距離と運転時間が出て、経由地より後のすべての到着が一緒に動きます。',
  'help.guide.roadtrip-via.step.4':
    'ハンドルにカーソルを重ねると、できることが出ます。「ドラッグでルートを変え、右クリックで削除」です。別の場所へドラッグすると、区間は新しい地点を通って描き直されます。',
  'help.guide.roadtrip-via.step.5': 'ハンドルを右クリックすると取り除かれます。区間はまた直行の道を走ります。',
  'help.guide.roadtrip-via.result': '区間は選んだ道をたどり、その日の距離、運転時間、到着時刻が計算し直されます。',
  'help.guide.roadtrip-via.tip.1':
    '経由地は立ち寄り先ではありません。番号も滞在も到着時刻もなく、その日の立ち寄り先の数にも入りません。',
  'help.guide.roadtrip-via.tip.2':
    'ハンドルはズームレベル9から描かれるので、旅行全体に合わせた地図では線だけが見えます。',
  'help.guide.roadtrip-via.tip.3':
    '描かれたどの区間からも2キロメートルより離れたクリックは無視され、飛行機、電車、フェリーへのクリックも同じです。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '区間の別の走り方を試す',
  'help.guide.roadtrip-alternatives.goal': '1つの区間についてルーターがほかに何を出すかを見て、それを選びます。',
  'help.guide.roadtrip-alternatives.step.1':
    '行程の一覧で運転の帯をクリックします。2つの立ち寄り先のあいだにある、区間を距離と時間で示す行です。ラベルは「別のルート」です。',
  'help.guide.roadtrip-alternatives.step.2':
    '「この区間の走り方」が地図の上に開きます。道ごとに1項目で、それぞれ地図にそれ自身の色で描かれます。',
  'help.guide.roadtrip-alternatives.step.3':
    '項目にカーソルを重ねるとその道が光ります。「現在」はいま走っている道、「最速」はいちばん速い道です。ほかはどれだけ遅いか、あるいはどの道路種別を外しているかを示します。',
  'help.guide.roadtrip-alternatives.step.4': '項目をクリックするとその道を走り、「閉じる」を押すと今の道のままです。',
  'help.guide.roadtrip-alternatives.result':
    '区間は選んだ道を走り、行程の一覧の距離とそれ以降の到着時刻も一緒に変わります。',
  'help.guide.roadtrip-alternatives.tip.1':
    '別の道を選ぶと区間に経由地が置かれ、すでにあった経由地は置き換わります。ルーター自身の道を選ぶと、それらはまた取り除かれます。',
  'help.guide.roadtrip-alternatives.tip.2':
    '「高速道路なし」「有料道路なし」「フェリーなし」は、独自の速度モデルを持つ2つ目のエンジンから来るので、その所要時間はほかと比べられません。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '車と運転の上限を設定する',
  'help.guide.roadtrip-limits.goal': '何で走るか、そして一度にどれだけ走る気があるかを TREK に伝えます。',
  'help.guide.roadtrip-limits.step.1':
    '「運転の設定」は右の列の検索の下にあります。バッジが何を設定してあるかを示します。クリックすると開きます。',
  'help.guide.roadtrip-limits.step.2':
    '「運転」の下では、「連続運転の上限」と「1日の運転」は分です。空欄は「なし」を意味し、何も警告されません。',
  'help.guide.roadtrip-limits.step.3':
    '「車両」の下で、何で走るかを指定します。「ガソリン」は給油の立ち寄り先でのみ補給し、「電気」は充電の立ち寄り先でのみ、「両方」はどちらでも補給します。',
  'help.guide.roadtrip-limits.step.4':
    '「満タンでの航続」、または「1回の充電での航続距離」は自分で入力します。その下の「車のデータから計算する」は「タンク容量」と「消費量」、または「バッテリー容量」と「消費量」を取って計算します。',
  'help.guide.roadtrip-limits.step.5':
    '「できるだけ避ける」は禁止ではなく希望です。迂回路のない日はその道をそれでも使い、ヘッダーでそう伝えます。',
  'help.guide.roadtrip-limits.step.6':
    'ダイアログを閉じます。カードが何を設定してあるかを示し、行程の一覧が上限を超えるすべての区間とすべての日に印を付けます。',
  'help.guide.roadtrip-limits.result':
    'カードのバッジが何を設定してあるかを示し、上限を超えた区間と日はすべて行程の一覧でバッジを持ちます。',
  'help.guide.roadtrip-limits.tip.1': '設定は旅行に属するので、参加者全員が同じ車と同じ上限で計画します。',
  'help.guide.roadtrip-limits.tip.2':
    '「補給する量」は立ち寄り先でどこまで補給するかを示します。道中で 100 % まで充電する人はいないからです。給油や充電の立ち寄り先は、自分だけそれを上書きできます。',
  'help.guide.roadtrip-limits.tip.3':
    '「ルートの線」は運転の描き方を決めます。「日をつなぐ」は2つの日のあいだの夜もルートにし、「日ごとに色を分ける」は日ごとに自分の色を与えます。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '運転の1日に始まりと終わりを与える',
  'help.guide.roadtrip-day-window.goal': '自分で選んだ時刻に運転をやめ、その日をどこで終えるかを指定します。',
  'help.guide.roadtrip-day-window.step.1': '右の列の「運転の設定」を開き、「毎日の移動時間」を探します。',
  'help.guide.roadtrip-day-window.step.2':
    '「一日の開始時刻」を設定します。それだけでは何も起きません。下の注記のとおり、両方の時刻が必要です。',
  'help.guide.roadtrip-day-window.step.3':
    '「一日の終了時刻」を設定します。運転はその時刻で止まり、残りを翌朝へ持ち越します。行程の一覧には「一日の終了」の行と「移動を再開」の行が出ます。',
  'help.guide.roadtrip-day-window.step.4':
    '「1日の終了地点」で、終了時刻に道の上で休止する「ルートの途中」か、次の運転がそこを通り過ぎてしまう前に止まる「最後の場所」を選びます。',
  'help.guide.roadtrip-day-window.step.5':
    'ダイアログを閉じます。「運転の設定」のカードは2つの時刻をバッジとして持ちます。',
  'help.guide.roadtrip-day-window.result':
    '運転は設定した長さの移動日に切り分けられ、収まらない分は最後の日の後の計算上の日に続きます。あなたの日とその場所は変わりません。',
  'help.guide.roadtrip-day-window.tip.1':
    'どちらかの時刻を消すと、全体がまた無効になります。自分で立ち寄り先に固定した時刻は常に優先されます。',
  'help.guide.roadtrip-day-window.tip.2':
    '毎日の移動時間を設定すると、日は常につながります。ある日の最後の立ち寄り先から次の日の最初の立ち寄り先までの運転もルートにされ、数に入ります。',
  'help.guide.roadtrip-day-window.tip.3':
    '一日の終わりは地図上の目印にもなります。日の番号が付いた月です。ルート沿いに、または場所の上にドラッグすると別のところで日を終えられます。右クリックすると自動の終わりに戻り、このダイアログの「一日の終了地点を自動に戻す」はすべてを元に戻します。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '燃料が尽きる前に補給する',
  'help.guide.roadtrip-refuel.goal': '車がまだ届く区間で給油できる場所を見つけ、運転に載せます。',
  'help.guide.roadtrip-refuel.step.1':
    '航続が設定されていると、行程の一覧は燃料が尽きる区間に帯を描きます。「ここで燃料切れ」と、その下に区間のどこまで進んだところかが出ます。',
  'help.guide.roadtrip-refuel.step.2':
    '帯の上のランプがボタンです。「給油所を探す」はすでに走った道沿いを探し、探しているあいだは「ルート沿いを検索中…」になります。',
  'help.guide.roadtrip-refuel.step.3':
    '最大3つのスタンドが返り、それぞれにルートからどれだけ離れているか、どれだけの航続を残せるかが付きます。',
  'help.guide.roadtrip-refuel.step.4':
    '候補のプラスが、それを給油の立ち寄り先として追加します。「立ち寄り先として追加」が種類と時間の入った状態で開き、「追加」が実際に通過する地点で区間に載せます。',
  'help.guide.roadtrip-refuel.result':
    '立ち寄り先は正しい区間に自分のアイコンで載り、航続はそこからまた数え直され、帯は消えます。',
  'help.guide.roadtrip-refuel.tip.1':
    '航続は最後の給油または充電の立ち寄り先から、日をまたいで数えられます。何で走るかが、どの立ち寄り先を数えるかを決めます。「ガソリン」は給油だけ、「電気」は充電だけです。',
  'help.guide.roadtrip-refuel.tip.2':
    '検索は尽きる地点より前の道を見て、予備を残し、寄り道を2回分数えるので、提示されるものはすべて本当に届きます。',
  'help.guide.roadtrip-refuel.tip.3':
    '答えが空でも行き止まりではありません。ランプは「もう一度」に変わります。場所の検索は共有サービスで、タイムアウトすることがあるからです。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '1日を読み込んだトラックに沿わせる',
  'help.guide.roadtrip-track.goal':
    'GPX または KML のトラックとして読み込んだ景色のよいルートに、1日の運転を載せます。',
  'help.guide.roadtrip-track.step.1':
    '日のヘッダーの「トラック」バッジをクリックします。ダイアログがその日で開きます。',
  'help.guide.roadtrip-track.step.2':
    'トラックを選びます。それぞれに全長と、この日に沿って走るのか、それともどれだけ離れているのかが出て、近い順に並びます。',
  'help.guide.roadtrip-track.step.3':
    '「このトラックをたどる」をクリックします。TREK は運転がトラックから最も離れるところに経由地を落とし、何度も繰り返してルートを引き直します。',
  'help.guide.roadtrip-track.step.4':
    'いくつ経由地を置いたか、運転がいまどれだけ近くを保つかを示します。その下のボタンはその経由地をまた落とし、その日をルーターに返します。ダイアログを閉じればトラックは保たれます。',
  'help.guide.roadtrip-track.result':
    'その日の運転は、ルーターが選んだ道ではなくトラックをたどり、「トラック」バッジが点灯して、ポインターを重ねるとそのトラックの名前を示します。',
  'help.guide.roadtrip-track.tip.1':
    'ファイルは「日ごと」で「ファイルをインポート」から読み込み、「ルート」または「トラック（経路付き）」にチェックを入れます。旅行にトラックが1つ入るまで、どの日もこのバッジを持ちません。',
  'help.guide.roadtrip-track.tip.2':
    'トラックをたどると、その日の区間がすでに持っていた経由地は置き換わります。区間を手で整えるのは、トラックの前ではなく後にしてください。',
};

export default help;
