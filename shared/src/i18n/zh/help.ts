import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': '帮助与文档',
  'help.search': '搜索文档…',
  'help.contents': '目录',
  'help.noResults': '没有匹配的页面。',
  'help.errorTitle': '无法加载此页面',
  'help.errorBody': '帮助内容来自 TREK wiki。请检查网络连接后重试。',

  // center
  'help.center.button': '此页面的帮助',
  'help.center.title': '帮助',
  'help.center.onThisScreen': '本页相关',
  'help.center.screens': '页面',
  'help.center.thisScreen': '当前',
  'help.center.subScreens': '{count} 个子页面',
  'help.center.subScreensLabel': '子页面',
  'help.center.guidesCount': '{count} 篇指南',
  'help.center.goToScreen': '前往{screen}',
  'help.center.overview': '概览',
  'help.center.howTo': '如何操作',
  'help.center.searchPlaceholder': '搜索指南和文档…',
  'help.center.searchEmpty': '没有找到与“{query}”相关的内容。',
  'help.center.searchGuides': '指南',
  'help.center.searchDocs': '文档',
  'help.center.searchError': '搜索暂时不可用。',
  'help.center.back': '返回',
  'help.center.close': '关闭帮助',
  'help.center.steps': '{count} 个步骤',
  'help.center.step': '第 {n} 步',
  'help.center.stepsLabel': '步骤',
  'help.center.stepOf': '第 {n} 步，共 {total} 步',
  'help.center.screenshot': '截图',
  'help.center.result': '你会得到',
  'help.center.tips': '小贴士',
  'help.center.related': '相关内容',
  'help.center.openDocs': '在“帮助与文档”中打开',
  'help.center.docsSection': '文档中',
  'help.center.noContext': '此页面暂时没有指南。',
  'help.center.noContextHint': '搜索文档，或告诉我们你想找什么。',
  'help.center.feedback': '还缺什么吗？',
  'help.center.feedbackLink': '在 GitHub 上告诉我们',
  'help.center.discord': '在 Discord 提问',
  'help.center.quick': '快速',
  'help.center.guide': '指南',
  'help.center.tour': '操作演示',
  'help.center.imageAlt': '“{title}”第 {n} 步',

  // ctx
  'help.ctx.dashboard.title': '仪表盘',
  'help.ctx.dashboard.summary':
    '仪表盘展示你的所有旅行。顶部做成登机牌样式的卡片显示正在进行或即将开始的旅行，下方一行统计你已经走过的旅程，下面的卡片则列出你正在计划、已归档或已结束的每一次旅行。',
  'help.ctx.dashboard.bullet.1':
    '登机牌：显示进行中或下一个旅行，包含日期、旅伴、地点和倒计时。点击即可打开旅行。右上角的四个按钮分别用于编辑、复制、归档和删除。',
  'help.ctx.dashboard.bullet.2': '旅行统计：汇总你所有旅行中去过的国家、旅行次数、在途天数和飞行距离。',
  'help.ctx.dashboard.bullet.3':
    '旅行卡片，可按“计划中”“已归档”和“已完成”筛选，以网格或列表显示。上方的搜索框会同时搜索你所有的旅行，可按标题、日期或旅行中的地点查找。编辑、复制、归档和删除旅行的按钮位于每张卡片照片的右上角。',
  'help.ctx.dashboard.bullet.4':
    '右侧的小组件：货币换算器、“收藏”（启用收藏扩展时）、世界时钟、“接下来的预订”，以及来自插件的小组件。内置小组件可以在“设置”的“外观”中关闭。',
  'help.ctx.dashboard.bullet.5': '“新建旅行”卡片和右下角的按钮都可以新建旅行。',

  // create-trip
  'help.guide.create-trip.title': '新建旅行',
  'help.guide.create-trip.goal': '用名称、日期和封面照片开始一个新旅行。',
  'help.guide.create-trip.step.1': '点击“新建旅行”。旅行列表末尾的卡片和右下角的按钮作用相同。',
  'help.guide.create-trip.step.2': '给旅行起个名字。这是唯一必填的内容，其余都可以以后再补。',
  'help.guide.create-trip.step.3':
    '选择开始和结束日期。TREK 会为每个日期创建一天，你就可以开始安排行程了。还没有日期？两个都留空，改为输入“天数”。',
  'help.guide.create-trip.step.4':
    '可选：添加封面照片。可以上传自己的照片，拖入或粘贴一张，也可以在 Unsplash 上搜索目的地的图片。',
  'help.guide.create-trip.step.5': '点击“创建新旅行”。',
  'help.guide.create-trip.result': '旅行会出现在仪表盘上。如果它是你的下一次旅行，会显示在顶部的登机牌里。',
  'help.guide.create-trip.tip.1': '日期以后还能修改。如果已经有预订，TREK 会问你是否让预订跟着日期一起移动。',
  'help.guide.create-trip.tip.2': '你在这里选择的旅行货币，是所有费用换算时使用的货币。建议选择目的地的货币。',

  // edit-trip
  'help.guide.edit-trip.title': '编辑旅行',
  'help.guide.edit-trip.goal': '重命名旅行、修改日期或调整设置。',
  'help.guide.edit-trip.step.1': '点击旅行卡片（或登机牌）右上角的铅笔图标。',
  'help.guide.edit-trip.step.2': '修改你需要改的内容：名称、描述、日期、封面、货币、提醒或旅伴。',
  'help.guide.edit-trip.step.3': '点击“更新”。',
  'help.guide.edit-trip.result': '卡片会立即更新，旅行中的每位成员都能看到。',
  'help.guide.edit-trip.tip.1':
    '移动已有预订的旅行的开始日期时，会询问预订是否也要跟着移动。缩短旅行时，会列出将被删除的日期及其中的安排，只有点击“移除天数并保存”后才会保存。',

  // cover-image
  'help.guide.cover-image.title': '设置封面照片',
  'help.guide.cover-image.goal': '给旅行配一张图片，显示在旅行卡片和登机牌上。',
  'help.guide.cover-image.step.1': '点击旅行卡片上的铅笔图标，打开旅行的编辑表单。',
  'help.guide.cover-image.step.2': '在“封面图片”下，拖入或粘贴一张照片，点击上传，或输入目的地并点击“搜索 Unsplash”。',
  'help.guide.cover-image.step.3': '选择一张照片，然后点击“更新”。',
  'help.guide.cover-image.result': '照片会随旅行一起保存，并显示在所有列出该旅行的地方。',
  'help.guide.cover-image.tip.1': '从 Unsplash 搜索选用的照片会自动标注来源；你自己上传的照片只保存在你的服务器上。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '复制旅行',
  'help.guide.duplicate-trip.goal': '把一次旅行当作模板，用来创建新的旅行。',
  'help.guide.duplicate-trip.step.1': '点击卡片右上角的复制图标。',
  'help.guide.duplicate-trip.step.2': '看清哪些内容会被复制、哪些不会，然后点击“复制旅行”。',
  'help.guide.duplicate-trip.result':
    '你的仪表盘上会出现一份副本，名称是原名称加上（副本）。你可以重命名它并修改日期。',
  'help.guide.duplicate-trip.tip.1':
    '日期、地点、路线和公路旅行的线路、预订、预算项目、行李清单、待办事项和每日备注都会一并复制，其中行李清单和待办事项复制后为未勾选状态。成员、聊天、投票、文件和分享链接不会复制。',

  // archive-trip
  'help.guide.archive-trip.title': '归档和恢复旅行',
  'help.guide.archive-trip.goal': '不删除旅行，只是先从旅行列表中收起来，以后随时可以恢复。',
  'help.guide.archive-trip.step.1': '点击卡片右上角的归档图标。',
  'help.guide.archive-trip.step.2': '把卡片上方的筛选切换为“已归档”，就能再次看到它。',
  'help.guide.archive-trip.step.3': '点击卡片上的“恢复”，旅行会回到“计划中”；如果日期已过，则回到“已完成”。',
  'help.guide.archive-trip.result': '已归档的旅行会保留所有数据，只是不再显示在仪表盘和全部旅行的日历订阅中。',

  // delete-trip
  'help.guide.delete-trip.title': '删除旅行',
  'help.guide.delete-trip.goal': '永久删除一次旅行。',
  'help.guide.delete-trip.step.1': '点击卡片右上角的垃圾桶图标。',
  'help.guide.delete-trip.step.2': '点击“删除”确认。对话框里会写明旅行的名称，方便你确认没有选错。',
  'help.guide.delete-trip.result':
    '旅行及其日程、地点、预订和文件都会被删除，且无法撤销。如果拿不准，请改为归档这次旅行。',

  // filter-and-view
  'help.guide.filter-and-view.title': '查找已结束的旅行，切换网格和列表',
  'help.guide.filter-and-view.goal': '查看已结束或已归档的旅行，并选择你喜欢的布局。',
  'help.guide.filter-and-view.step.1': '使用卡片上方的“计划中”“已归档”和“已完成”。结束日期已过的旅行都归入“已完成”。',
  'help.guide.filter-and-view.step.2': '点击列表图标切换为紧凑列表，再点一次则回到网格。',
  'help.guide.filter-and-view.result': '仪表盘会在这台设备上记住你的布局。',

  // calendar-feed
  'help.guide.calendar-feed.title': '在日历中订阅所有旅行',
  'help.guide.calendar-feed.goal': '在日历应用中查看所有进行中旅行的日程和预订，并保持同步。',
  'help.guide.calendar-feed.step.1': '点击视图切换按钮旁边的日历图标。',
  'help.guide.calendar-feed.step.2': '点击“启用日历订阅”。TREK 会创建一个私有的订阅链接。',
  'help.guide.calendar-feed.step.3':
    '点击“添加到 Google 日历”或“添加到 Apple 日历 / Outlook”。其他日历应用请展开“或手动复制链接”，从那里复制链接。',
  'help.guide.calendar-feed.result':
    '每个进行中的旅行都会出现在你的日历里，并自动更新。已归档的旅行和结束超过 90 天的旅行不会包含在内。',
  'help.guide.calendar-feed.tip.1':
    '请保密这个链接，任何拿到它的人都能读取订阅内容。如果链接已经泄露，点击“重新生成”会得到新链接，旧链接随即失效。“关闭”则会彻底移除链接。',

  // widgets
  'help.guide.widgets.title': '选择仪表盘组件',
  'help.guide.widgets.goal': '显示或隐藏统计行和右侧的组件。',
  'help.guide.widgets.step.1': '点击右上角的头像菜单，选择“设置”。',
  'help.guide.widgets.step.2': '切换到“外观”标签页。',
  'help.guide.widgets.step.3':
    '在“仪表盘组件”下，分别为“桌面端”和“移动端”开启或关闭每个组件。“右侧栏”可一次关闭整个右栏。',
  'help.guide.widgets.step.4': '回到仪表盘，更改会立即生效。',
  'help.guide.widgets.result': '隐藏小组件后，旅行能占用更多空间。关闭整个右侧栏，布局会居中显示。',
  'help.guide.widgets.link': '打开外观设置',

  // currency-widget
  'help.guide.currency-widget.title': '换算货币',
  'help.guide.currency-widget.goal': '按当前汇率在两种货币之间换算金额。',
  'help.guide.currency-widget.step.1': '输入金额，并选择两种货币。',
  'help.guide.currency-widget.step.2': '两种货币之间的箭头用来对调，圆形箭头用来刷新汇率。',
  'help.guide.currency-widget.result': '你选的货币对会保存在账号里，所以每台设备上都一样。',
  'help.guide.currency-widget.tip.1': '汇率来自免费的 Frankfurter 服务。点击小组件角落的圆形箭头可获取最新汇率。',

  // timezones-widget
  'help.guide.timezones-widget.title': '添加世界时钟',
  'help.guide.timezones-widget.goal': '随时查看各个目的地的当地时间。',
  'help.guide.timezones-widget.step.1': '点击“时区”小组件中的 +，搜索一个城市，例如 Lisbon，然后从列表中选中它。',
  'help.guide.timezones-widget.step.2': '要移除某个时钟，把鼠标移到它上面，点击右侧出现的 ×。',
  'help.guide.timezones-widget.result': '你设置的时钟会保存在你的账户中。',
  'help.guide.search-trips.title': '搜索旅行',
  'help.guide.search-trips.goal': '按名称、日期或你在旅行中规划的地点查找旅行，已归档的旅行也能搜到。',
  'help.guide.search-trips.step.1':
    '在卡片上方的“搜索行程或地点”中输入。列表会随着输入实时筛选，已计划、已归档和已完成的旅行会一起搜索。',
  'help.guide.search-trips.step.2':
    '如果旅行是因为其中某个地点而匹配的，该地点会显示在旅行标题下方。点击搜索框里的 x 或按 Esc 键，即可重新显示所有旅行。',
  'help.guide.search-trips.result': '仪表盘只显示匹配的旅行。清空搜索框后，所有旅行都会重新显示。',
  'help.guide.search-trips.tip.1':
    '也可以按日期搜索：输入年份和月份，例如 2027年5月 或 2027-05，就能找到这个月的旅行。',
  'help.guide.search-trips.tip.2':
    '搜索期间，“计划中”“已归档”和“已完成”的切换不会生效，这样就不会因为筛选不对而漏掉某个旅行。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': '假期',
  'help.ctx.vacay.summary':
    '“假期”是你的个人休假计划器：一年有多少天假、已经记了哪几天、还剩多少。网格显示整年；侧栏里有年份选择、一起规划的人、别人与你共享的日历、图例和你的年假额度。',
  'help.ctx.vacay.bullet.1': '年度网格：十二张月份卡片，每天一格。点击某一天即可记录或清除。小蓝点表示这一天已有旅行。',
  'help.ctx.vacay.bullet.2':
    '底部的工具栏：第一个按钮带有你的名字和颜色，用来登记休假；“公司假日”标记全公司休息的日子。“半天”和“调休”会改变一次点击所登记的内容，“半天”也适用于公司假日。',
  'help.ctx.vacay.bullet.3':
    '“年假额度”：所选年份的“天”、“已使用”和“剩余”，旁边是结转和调休天数。点击卡片标题可以折叠它。',
  'help.ctx.vacay.bullet.4':
    '“人数”是与你共享计划的人，各有自己的颜色。“共享日历”用彩色圆环显示别人的休假日，你不能编辑它们。',
  'help.ctx.vacay.bullet.5':
    '设置包括周末、每周起始日、结转、你的休假年度、公司假日、公共假日和学校假期日历，以及与他人共同规划时用到的“解除合并”。',
  // log-day
  'help.guide.log-day.title': '记录一天休假',
  'help.guide.log-day.goal': '在年度日历中标记休假日，余额会随之更新。',
  'help.guide.log-day.step.1':
    '看一下底部工具栏的第一个按钮。如果它显示你的名字和颜色，点击某一天就会为你登记一天休假。',
  'help.guide.log-day.step.2': '在任意月份卡片中点击某一天。这一天会填上你的颜色，“使用于”的天数加一。',
  'help.guide.log-day.step.3': '再次点击同一天即可清除。',
  'help.guide.log-day.result': '这一天已记录。“天”“已使用”和“剩余”会立即更新，与你合并计划的人也会马上看到变化。',
  'help.guide.log-day.tip.1': '在“设置”中开启“锁定周末”后，无法登记周末。之前已登记的周末仍可清除。',
  'help.guide.log-day.tip.2': '格子里的蓝点表示你的某次旅行包含这一天，这样你就能看出休假和出行在哪里重叠。',
  // half-day
  'help.guide.half-day.title': '记录半天假',
  'help.guide.half-day.goal': '只休一个下午，只用掉半天的假期额度。',
  'help.guide.half-day.step.1': '在工具栏中打开“半天”。日历中带橙色圆点的就是半天假。',
  'help.guide.half-day.step.2': '点击某一天，它会记为 0.5 天，并在角上显示橙色圆点。',
  'help.guide.half-day.step.3': '用完后关闭“半天”。如果你点击的半天设置与当前不同，它会改为当前的设置。',
  'help.guide.half-day.result': '“已使用”增加 0.5。“半天”和“调休”互不影响，所以也可以记一个半天调休。',
  'help.guide.half-day.tip.1': '工具栏始终显示你下次点击会放下的标记，记录前可以先确认。',
  // comp-day
  'help.guide.comp-day.title': '记录调休或弹性工时',
  'help.guide.comp-day.goal': '调休，不占用年假。',
  'help.guide.comp-day.step.1': '在工具栏中打开“调休”。日历中带斜线的圆盘就是调休日。',
  'help.guide.comp-day.step.2': '点击某一天，它会用你的颜色画上斜线填充，而不是纯色。',
  'help.guide.comp-day.result': '调休日会在额度方块旁单独统计，不会减少“剩余”。',
  'help.guide.comp-day.tip.1': '加班换来的休息、弹性工时或补休：凡是休息但不算休假的，都记在这里。',
  // entitlement
  'help.guide.entitlement.title': '设置年假额度',
  'help.guide.entitlement.goal': '告诉“假期”你一年有多少天假。',
  'help.guide.entitlement.step.1':
    '在侧边栏的“年假额度”卡片中，点击你那一行的“天”图块。如果卡片已折叠，先点击标题展开。',
  'help.guide.entitlement.step.2': '输入你的天数并按回车键。按 Esc 键则保留原值。',
  'help.guide.entitlement.result': '“剩余”会根据你的年假额度、结转（如有）和已使用的天数重新计算。',
  'help.guide.entitlement.tip.1': '每年的额度各自独立，所以在这里修改只会影响所选的年份。',
  // years
  'help.guide.years.title': '添加和切换年份',
  'help.guide.years.goal': '现在就规划明年，或者回顾去年。',
  'help.guide.years.step.1': '点击年份右边的 + 添加下一年，点击左边的 + 添加上一年。',
  'help.guide.years.step.2': '用箭头或下方的年份标签切换年份。',
  'help.guide.years.step.3':
    '要删除某一年，把鼠标悬停在它的年份标签上，点击小减号。这也会删除该年的所有记录，请谨慎确认。',
  'help.guide.years.result': '每一年都有各自的年假额度和记录，结转把相邻两年连在一起。',
  // company-holidays
  'help.guide.company-holidays.title': '标记公司假日',
  'help.guide.company-holidays.goal': '把全公司放假的日子标记出来，同时不占用任何人的额度。',
  'help.guide.company-holidays.step.1':
    '打开“设置”，确认“公司假日”已开启。它默认是开启的。只有开启时，工具栏才会显示这个模式。',
  'help.guide.company-holidays.step.2': '回到网格，把工具栏切换到“公司假日”。',
  'help.guide.company-holidays.step.3': '点击这些日期，它们会变成琥珀色并出现在图例中。再点一次可清除。',
  'help.guide.company-holidays.result': '所有合并计划的人都能看到公司假日，而且它们不会减少“剩余”。',
  'help.guide.company-holidays.tip.1': '任何已合并的人都能编辑公司假日，所以最好先约定由谁来维护。',
  // public-holidays
  'help.guide.public-holidays.title': '显示法定假日',
  'help.guide.public-holidays.goal': '把你所在国家或地区的法定假日显示在网格上。',
  'help.guide.public-holidays.step.1': '打开“设置”，开启“公共假日”。',
  'help.guide.public-holidays.step.2':
    '点击“添加日历”，选择国家，需要时再选择地区。还可以设置颜色和标签。然后点击“添加”。',
  'help.guide.public-holidays.step.3': '关闭“设置”。假日会显示在日历网格和图例中。',
  'help.guide.public-holidays.result': '公共假日以日历的颜色标记，不会计入你的额度。',
  'help.guide.public-holidays.tip.1': '可以添加多个日历，比如你自己所在的地区，再加上已合并同事所在的地区。',
  // school-holidays
  'help.guide.school-holidays.title': '显示学校假期',
  'help.guide.school-holidays.goal': '在自己的休假旁边查看所在地区的学校假期。',
  'help.guide.school-holidays.step.1': '打开“设置”，开启“学校假期”。',
  'help.guide.school-holidays.step.2':
    '点击“添加日历”并选择国家。如果该国的日历分地区，再选择地区或分组，然后点击“添加”。',
  'help.guide.school-holidays.step.3': '关闭“设置”。学校假期会以日历的颜色淡淡着色，这些日期的底部还有一条色带。',
  'help.guide.school-holidays.result': '学校假期只在日历中显示，不会减少任何人的额度。',
  'help.guide.school-holidays.tip.1': '没有你所在的地区？管理员可以在“管理员”，“个性化”，“学校假期”中手动维护。',
  // weekends
  'help.guide.weekends.title': '锁定周末并设置每周起始日',
  'help.guide.weekends.goal': '把周末排除在统计之外，并选择每周从哪一天开始。',
  'help.guide.weekends.step.1': '打开“设置”。',
  'help.guide.weekends.step.2': '打开“锁定周末”，然后在“周末”下选择哪几天算作你的周末。',
  'help.guide.weekends.step.3': '在“每周开始于”下，选择“周一”或“周日”。',
  'help.guide.weekends.result': '被排除的日子在网格中显示为灰色，不会被误记。',
  // leave-year
  'help.guide.leave-year.title': '设置休假年度',
  'help.guide.leave-year.goal': '按财年或入职日期来计算额度，而不是按一月到十二月。',
  'help.guide.leave-year.step.1': '打开“设置”，找到“休假年度”。',
  'help.guide.leave-year.step.2': '选择“日历年”“财年”（并指定起始的月和日）或“入职日”（并指定入职日期）。',
  'help.guide.leave-year.result': '年假额度、已使用天数和结转都按这个周期计算，网格也从它的第一个月开始。',
  'help.guide.leave-year.tip.1': '此设置是个人的：在合并计划中，每个人都保留自己的休假年度和数据。',
  // carry-over
  'help.guide.carry-over.title': '把没用完的天数结转',
  'help.guide.carry-over.goal': '把一个周期结束时剩下的天数加到下一个周期。',
  'help.guide.carry-over.step.1': '打开“设置”。',
  'help.guide.carry-over.step.2': '开启“结转”。',
  'help.guide.carry-over.result': '结转的数量会按你所有的年份重新计算，并显示在额度下方。',
  'help.guide.carry-over.tip.1': '关闭后，所有结转余额都会归零。',
  // invite
  'help.guide.invite.title': '和别人一起规划',
  'help.guide.invite.goal': '把你的计划与另一位 TREK 用户的计划合并，这样你们在同一张网格里就能看到彼此的休假。',
  'help.guide.invite.step.1': '点击“人数”卡片中的人形图标。',
  'help.guide.invite.step.2': '选择用户并点击“发送邀请”。',
  'help.guide.invite.step.3':
    '对方下次打开“假期”时会收到通知和合并请求。在此之前，邀请显示为待处理，把鼠标悬停在上面即可取消。',
  'help.guide.invite.result': '两份计划合并：每个人有一种颜色，可以互相帮对方记录休假，所有内容实时同步。',
  'help.guide.invite.tip.1': '想撤销合并，请在“设置”中点击“解除”，每个人的条目会回到各自的计划中。',
  'help.guide.invite.tip.2': '如果对方只需要看到你的休假日，请共享日历，而不要合并。',
  // share-calendar
  'help.guide.share-calendar.title': '以只读方式共享日历',
  'help.guide.share-calendar.goal': '让别人看到你什么时候休假，但不能修改你的计划。',
  'help.guide.share-calendar.step.1': '点击“共享日历”卡片中的分享图标。',
  'help.guide.share-calendar.step.2': '选择用户，点击“共享”。对方无需接受。',
  'help.guide.share-calendar.step.3':
    '与你共享的日历显示在卡片顶部：点击某个日历可隐藏或显示它，也可以把鼠标悬停在上面，点击 x 将其移除。在“你共享给”下，把鼠标悬停在某个名字上，点击“停止分享”。',
  'help.guide.share-calendar.result': '你的休假会以彩色圆环显示在对方的网格里。对方不能编辑你共享的任何内容。',
  'help.guide.share-calendar.tip.1': '共享和合并互不影响：你可以和一个人合并，同时与其他人共享。',
  'help.guide.share-calendar.tip.2': '把鼠标移到带圆环的日期上，就能看到谁休假、休多久。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': '足迹',
  'help.ctx.atlas.summary':
    '足迹用世界地图展示你去过的地方：旅行去过的每个国家都会被上色，在使用 TREK 之前去过的国家可以手动添加。放大可以查看地区，还可以建立心愿单，记下想去的地方，并在底部的玻璃面板中查看你的统计数字。',
  'help.ctx.atlas.bullet.1':
    '地图：去过的国家各有固定的专属颜色，计划前往的国家是虚线轮廓，心愿清单上的国家是斜线填充，其余国家为灰色。鼠标悬停在某个国家上，可以看到相关的旅行、地点，以及首次和最近一次到访。',
  'help.ctx.atlas.bullet.2':
    '顶部的搜索：输入国家或地点。没去过的国家会打开它的弹窗，去过的国家则在面板中显示它的卡片。选择一个地点时，地图会定位到它所在的地区，方便你标记该地区。',
  'help.ctx.atlas.bullet.3':
    '右上角的“显示计划中的国家”：显示你即将出行的旅行所涉及的国家。只有当你有这类旅行时，才会出现这个开关。',
  'help.ctx.atlas.bullet.4':
    '底部面板：“统计”标签页显示国家（计划中的国家在旁边）、地区、旅行、地点、城市、天数、大洲、连续记录和今年的旅行；“心愿单”标签页显示你还想去的地方；启用游览扩展后，还有“游览”标签页，显示你已完成路线的距离和爬升。',
  'help.ctx.atlas.bullet.5':
    '地区：放大到近处后，地图会显示州和省。点击其中一个，可以标记它、取消标记，或把它加入心愿单。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：连接该扩展后，统计左侧会出现一个面板，可以根据你的记录勾掉心愿并添加国家。只有在你确认后才会执行。',
  // mark-country
  'help.guide.mark-country.title': '把国家标记为已访问',
  'help.guide.mark-country.goal': '添加一个你在使用 TREK 之前去过的国家，让地图和统计数字也把它算进去。',
  'help.guide.mark-country.step.1': '在地图顶部的搜索框中输入国家名称。',
  'help.guide.mark-country.step.2': '从列表中选择它。地图会移动到该国，并弹出该国的弹窗。',
  'help.guide.mark-country.step.3': '选择“标记为已访问”。',
  'help.guide.mark-country.result':
    '该国家会在地图上获得一种颜色，“国家”数量加一。这个颜色是固定的：之后再标记其他国家，已有国家的颜色不会改变。',
  'help.guide.mark-country.tip.1': '在地图上点击灰色的国家，会打开同一个弹窗。对于面积小的国家，用搜索更可靠。',
  'help.guide.mark-country.tip.2': '你手动标记的国家始终算作已访问，不论前往该国的旅行是哪几天。',
  // unmark-country
  'help.guide.unmark-country.title': '移除标记过的国家',
  'help.guide.unmark-country.goal': '把你手动标记的国家从地图上移除。',
  'help.guide.unmark-country.step.1':
    '搜索并选择该国，或者直接在地图上点击它。如果是你自己标记的国家，弹窗会询问是否移除。',
  'help.guide.unmark-country.step.2': '点击“移除”确认。',
  'help.guide.unmark-country.result': '该国家重新变成灰色，不再计入统计。',
  'help.guide.unmark-country.tip.1':
    '只有手动标记的国家才能这样移除。有旅行或地点的国家会一直保持标记，直到这些旅行或地点被移除。对于手动标记的国家，面板里它的详情卡片上也有“移除”。',
  // country-details
  'help.guide.country-details.title': '查看你在某个国家做过什么',
  'help.guide.country-details.goal': '打开一个已去过的国家，直接跳转到你去那里的旅行。',
  'help.guide.country-details.step.1': '在地图顶部的搜索框中输入你去过的国家。',
  'help.guide.country-details.step.2':
    '选中它。地图会移到那里，底部的面板里会出现一张卡片，上面有国旗、表示地点、旅行和已去过地区的徽章，以及前三次旅行各一个标签。',
  'help.guide.country-details.result': '点击旅行标签，即可在规划器中打开那次旅行。',
  'help.guide.country-details.tip.1':
    '把鼠标悬停在地图上的国家上，会显示同样的数字，另外还有首次和最近一次到访的时间。',
  // planned-countries
  'help.guide.planned-countries.title': '显示你要去的国家',
  'help.guide.planned-countries.goal': '在地图上显示即将出行的旅行所涉及的国家，但不把它们算作已访问。',
  'help.guide.planned-countries.step.1': '打开右上角的“显示计划中的国家”。旁边的数字表示计划中的国家有多少个。',
  'help.guide.planned-countries.step.2':
    '搜索一个计划中的国家并选中它：面板会显示“计划中”，地图提示会显示你的出发时间。',
  'help.guide.planned-countries.result': '计划中的国家以虚线轮廓显示，不会和你已经去过的国家混淆。开关会记住你的选择。',
  'help.guide.planned-countries.tip.1':
    '去某个国家的旅行一旦开始，该国就算作去过，进行中的旅行也一样。没有日期的旅行完全不计入统计。',
  'help.guide.planned-countries.tip.2': '这个开关只有在你有即将出发的旅行时才会出现。',
  // regions
  'help.guide.regions.title': '标记地区',
  'help.guide.regions.goal': '不只标记国家，还可以标记你去过的州、省或县。',
  'help.guide.regions.step.1':
    '放大到某个国家，直到出现它的州或省边界。如果搜索并选中这个国家，地图会自动移到足够近的位置。',
  'help.guide.regions.step.2': '点击一个地区。鼠标悬停在地区上会显示它的名称，弹窗显示该地区及其所属国家。',
  'help.guide.regions.step.3': '选择“标记为已访问”。',
  'help.guide.regions.result': '该地区会填上所属国家的颜色。标记地区时，如果这个国家还没算作去过，也会一并标记。',
  'help.guide.regions.tip.1':
    '点击一个已去过的地区，会出现“移除”，不论这个地区是你自己标记的，还是因为某个地点而被自动加上的。',
  'help.guide.regions.tip.2': '你有实际地点的地区会自动标记，无需任何操作。',
  // search-place
  'help.guide.search-place.title': '查找地点并标记所在地区',
  'help.guide.search-place.goal': '不用知道城市属于哪个地区，搜索慕尼黑就能标记巴伐利亚。',
  'help.guide.search-place.step.1':
    '在搜索框中输入城市、地标或地址。国家排在最前面，匹配的地点显示在下方的“地点”标题下。',
  'help.guide.search-place.step.2': '选择该地点。地图会移到那里，并找出这个位置所在的地区。',
  'help.guide.search-place.step.3': '为该地区选择“标记为已访问”；如果你还没去过，就选择“添加到心愿单”。',
  'help.guide.search-place.result':
    '该地区会被标记，所属国家也一并标记。如果地图数据包里没有某个国家的地区数据，则改为标记这个国家本身。',
  'help.guide.search-place.tip.1': '地点使用与 TREK 其他位置相同的搜索，所以用的是管理员设置的服务商。',
  // bucket-country
  'help.guide.bucket-country.title': '把国家加入心愿单',
  'help.guide.bucket-country.goal': '在地图上建一份想去的国家心愿清单，与去过的国家分开。',
  'help.guide.bucket-country.step.1': '搜索并选择该国家，或直接在地图上点击它。',
  'help.guide.bucket-country.step.2': '选择“添加到心愿单”。',
  'help.guide.bucket-country.step.3': '如果已经知道时间，就选择月份和年份，然后点击“添加到心愿单”确认。',
  'help.guide.bucket-country.result':
    '该国家会用斜线填充，颜色就是你去过之后它将呈现的颜色，同时出现在面板的“心愿单”标签页中。',
  'help.guide.bucket-country.tip.1': '国家加入心愿单后，同一个弹窗里会出现“从心愿单移除”。',
  'help.guide.bucket-country.tip.2':
    '每个目标日期对应一条：同一个国家可以以两个不同的月份出现在心愿单里，但同一个月不能出现两次。',
  // bucket-place
  'help.guide.bucket-place.title': '把地点加入心愿清单',
  'help.guide.bucket-place.goal': '保存一个你想去的城市、景点或地址，附带坐标和目标日期。',
  'help.guide.bucket-place.step.1': '在底部面板中打开“心愿单”标签页。',
  'help.guide.bucket-place.step.2': '点击“添加地点”。',
  'help.guide.bucket-place.step.3':
    '输入名称，点击搜索按钮，再选择匹配的结果，这样地点就有了坐标。你也可以只输入名称，跳过搜索。',
  'help.guide.bucket-place.step.4': '如有需要，选择月份和年份，然后点击“添加”。',
  'help.guide.bucket-place.result': '该地点会连同目标日期出现在心愿单顶部。鼠标移上去会显示 ×，点击即可移除。',
  'help.guide.bucket-place.tip.1':
    '只有带坐标的心愿，Dawarich 才能在之后帮你标记为已完成。一旦你的记录显示你去过那里，它就会这样做。',
  // stats
  'help.guide.stats.title': '查看你的统计数据',
  'help.guide.stats.goal': '了解面板中的数字统计了什么，又没有统计什么。',
  'help.guide.stats.step.1':
    '“国家”是你实际去过的不同国家的数量；计划中的国家显示在数字下方，不计入其中。“地区”统计你去过的州和省。“旅行”“地点”和“天数”是你所有旅行的总和。“城市”根据你地点的地址推算，所以只是估计值。',
  'help.guide.stats.step.2':
    '各大洲显示每个大洲已访问的国家数。去过南极洲后，它才会出现在这一行。再往后是你的连续纪录（至少有一次旅行的连续年数）和你今年的旅行次数。',
  'help.guide.stats.result': '数字会随着你规划旅行自动更新，这里不需要你维护任何内容。',
  'help.guide.stats.tip.1':
    '城市是从地址文字中直接读取的，并不会再去查询。因此像“Osteria Francescana, Italy”这样的简短地址，或以县级行政区结尾的地址，可能会被算成地区而不是城市。',
  'help.guide.stats.tip.2': '手动标记的国家会计入“国家”和各大洲的统计，但不会增加旅行、地点或天数。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '根据你的记录添加国家',
  'help.guide.dawarich-countries.goal': '借助 Dawarich 查出你过去一年去过哪些国家，把你确认的国家加到地图上。',
  'help.guide.dawarich-countries.step.1':
    '连接 Dawarich 扩展后，地图底部、统计信息的左侧会出现一个带两块磁贴的 Dawarich 面板。点击“国家”。',
  'help.guide.dawarich-countries.step.2':
    '对话框会在“国家”标签页打开。点击“查找国家”：TREK 会逐月读取你的记录在最近 12 个月里覆盖的国家和城市，所以可能需要等一会儿。你的足迹里还没有的每个国家都会列出来，附带国旗、城市数量和第一个城市的名称。每个国家默认都是勾选的，点击某一行即可排除它。',
  'help.guide.dawarich-countries.step.3':
    '点击右下角的按钮确认，勾选了五行时按钮上写着“添加 5 个国家”。对话框会告诉你添加了多少个。关闭对话框时，地图已经更新好了。',
  'help.guide.dawarich-countries.result':
    '确认后的国家会在地图上着色，并计入“国家”，来源记为 Dawarich。你手动标记的国家不受影响。',
  'help.guide.dawarich-countries.tip.1':
    '足迹中已经显示为去过的国家会被排除在外，无论是手动标记的、来自某次旅行的，还是来自之前某次核对的，所以你自己的标记不会被改动。你之前从足迹中移除的国家，在这里确认后会重新加入。',
  'help.guide.dawarich-countries.tip.2':
    '如果 TREK 无法匹配某个国家名称，这个名称会列在各行下方，而不会被丢弃。“再查一次”会重新向 Dawarich 查询。列表下方的备注说明检查的是最近 12 个月，这个时间范围不能修改。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '根据你的记录勾掉心愿',
  'help.guide.dawarich-wishes.goal': '找出心愿清单上你实际已经到过的地点，并按到达的日期标记为已到达。',
  'help.guide.dawarich-wishes.step.1': '在地图底部、统计信息左侧的 Dawarich 面板中，点击“心愿单”。',
  'help.guide.dawarich-wishes.step.2':
    '对话框会在“心愿单”标签页打开。点击“核对愿望清单”：TREK 会在你的记录里查找每一条带坐标的条目。你已经到过的心愿会列出来，显示你离得有多近、停留了多久以及日期，并且默认勾选。已经勾掉的会显示“已勾掉”。列表下方的备注会统计没有坐标的条目，并写明规则：“在 250 米范围内停留 20 分钟后，才算实现心愿。”',
  'help.guide.dawarich-wishes.step.3':
    '点击右下角的按钮确认，勾选两行时按钮上写着“勾掉 2 项”。然后关闭对话框，打开旁边面板的“心愿单”标签页。',
  'help.guide.dawarich-wishes.result':
    '每个心愿都会带上绿色对勾，日期是当时停留的日期，而不是今天。悬停提示显示“依据你的 Dawarich 记录勾掉”。点击日期即可撤销。',
  'help.guide.dawarich-wishes.tip.1':
    '路过不算：你必须离那个地方很近，并且停留一段时间。如果有多次停留都符合条件，则采用最长的一次。没有坐标的心愿无法核对，所以请通过“添加地点”中的搜索来添加地点，而不要只输入名称。',
  'help.guide.dawarich-wishes.tip.2':
    '每次核对最多查看 50 条，先看还没勾掉的。条目更多时，TREK 会提示你。已经勾掉的心愿会保留它自己的日期。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '收藏',
  'help.ctx.collections.summary':
    '“收藏”是你在所有旅行之外的资料库：你发现并想留下的地点按名称整理成列表，每个地点的状态是“想法”“想去”或“已去过”；启用“游览”后，还可以存放你从旅行中保存下来的整条路线。地点和路线是复制进出旅行的，而不是链接，所以列表和旅行不会互相影响。',
  'help.ctx.collections.bullet.1':
    '左侧的列表栏依次显示：你自己的列表、别人共享给你的列表、你还没回复的邀请，以及“全部已保存”（汇总你所有列表中的内容）。顶部是“新建列表”和文件导入。',
  'help.ctx.collections.bullet.2':
    '打开的列表顶部显示它的颜色、封面、描述和链接、成员，右侧有“编辑”（仅所有者）、“导出”和“共享”。对于别人与你共享的列表，“共享”按钮会显示为“已共享”。',
  'help.ctx.collections.bullet.3':
    '地点上方的筛选行：用来添加地点的 +，“状态”“分类”“评分”和“排序”下拉菜单，用于“选择”的复选框图标，以及用于“从行程导入”的云图标。只有在不显示地图时，标签筛选才会出现在这一行。',
  'help.ctx.collections.bullet.4':
    '地点行：照片、名称和地址、标签和分类，以及右侧的状态标签。点一下标签，就会切换到下一个状态。',
  'help.ctx.collections.bullet.5':
    '右侧的地图：每个有坐标的地点一个图钉。顶部栏有“展开地图”（地图占满后变成“显示列表”）、标签筛选和管理标签的按钮，以及“搜索地点”框。点击图钉会打开该地点。',
  'help.ctx.collections.bullet.6':
    '详情页：点击一行可查看封面、分类、状态、星级评分、标签、描述和链接。封面上的相机图标用来更换照片。底部有“编辑”“复制到行程”、导航按钮和“从列表中移除”。',
  // create-list
  'help.guide.create-list.title': '创建列表',
  'help.guide.create-list.goal': '新建一个有名称、颜色和封面的列表，用来存放地点。',
  'help.guide.create-list.step.1': '点击列表侧栏顶部的“新建列表”。',
  'help.guide.create-list.step.2': '给列表起个名字并选择颜色。封面图片、描述和链接是可选的，之后可以通过“编辑”添加。',
  'help.guide.create-list.step.3': '点击“创建”。',
  'help.guide.create-list.result': '列表会以空白状态打开，可以用“添加地点”和“从行程导入”两种方式填充它。',
  'help.guide.create-list.tip.1': '封面可以是你自己上传的图片，也可以是在同一个对话框中通过 Unsplash 搜索找到的图片。',
  // add-place
  'help.guide.add-place.title': '添加地点',
  'help.guide.add-place.goal': '找到一个地点，一步就把名称、分类、状态和备注保存到当前打开的列表中。',
  'help.guide.add-place.step.1': '点击地点上方筛选行开头的 +。如果列表还是空的，点击页面中央的“添加地点”。',
  'help.guide.add-place.step.2': '在搜索框中输入地点，并选择一个结果。名称、地址和坐标会根据所选结果自动填入。',
  'help.guide.add-place.step.3':
    '设置状态，如有需要再加上分类、描述和链接，然后点击“添加”。对话框会保持打开，方便你继续添加下一个地点；点击“取消”则关闭对话框。',
  'help.guide.add-place.result': '地点会出现在列表中；如果有坐标，还会在地图上显示为图钉。',
  'help.guide.add-place.tip.1':
    '在旅行内部，用地点检查器或地点菜单中的“保存到收藏”，可以不离开旅行就把旅行中的地点放进列表。',
  'help.guide.add-place.tip.2':
    '列表必须是你自己的，或者你在其中是编辑者或管理员；在“全部已保存”和你只有查看权限的列表里没有 +。',
  // import-from-trip
  'help.guide.import-from-trip.title': '从行程导入地点',
  'help.guide.import-from-trip.goal': '把整次旅行的地点一次性放进列表，而不用逐个保存。',
  'help.guide.import-from-trip.step.1': '点击筛选栏里带云朵箭头的导入按钮。列表为空时，这个按钮在“添加地点”旁边。',
  'help.guide.import-from-trip.step.2': '选择你的一个旅行。',
  'help.guide.import-from-trip.step.3':
    '勾选你想要的地点。列表中已有的地点会置灰。没有安排到旅行任何一天的地点默认选中；如果每个地点都已安排到某天，则默认选中所有新地点。“仅新增”会隐藏列表中已有的地点。',
  'help.guide.import-from-trip.step.4': '点击“导入”。按钮上始终会写明即将添加的数量。',
  'help.guide.import-from-trip.result': '地点会连同名称、地址、坐标、描述和分类一起复制到列表中。旅行本身不会改变。',
  'help.guide.import-from-trip.tip.1': 'TREK 会自动跳过名称或坐标相同的重复地点，所以重复导入也没关系。',
  'help.guide.import-from-trip.tip.2': '在旅行的地点列表中，选择模式下有“保存到收藏”，可以只保存手动挑选的一组地点。',
  // place-status
  'help.guide.place-status.title': '设置地点的状态',
  'help.guide.place-status.goal': '记录哪些只是想法，哪些在候选名单里，以及你去过哪里。',
  'help.guide.place-status.step.1': '点击地点行最右侧的状态标签。“想法”会变成“想去”。',
  'help.guide.place-status.step.2': '再点一次变为“已去过”，再点一次回到“想法”。',
  'help.guide.place-status.result': '状态标签及其颜色立即变化，列表上方状态筛选里的数量也会更新。',
  'help.guide.place-status.tip.1': '状态只存在于“收藏”中。把地点复制到旅行时，状态不会一起复制。',
  'help.guide.place-status.tip.2':
    '在旅行中，“保存到收藏”会打开“保存到列表”，地点所在的每个列表各有一个状态标签；地点面板的选择栏里有“在清单中标记为已去过”。',
  // place-detail
  'help.guide.place-detail.title': '打开已保存的地点',
  'help.guide.place-detail.goal': '查看一个地点的全部信息和可以做的操作：编辑、复制到旅行、查找路线、移除。',
  'help.guide.place-detail.step.1': '点击某个地点所在的行。详情面板会在列表旁边打开，地图也会移到该地点。',
  'help.guide.place-detail.step.2':
    '底部有“编辑”“复制到行程”、在地图应用中打开该地点的导航按钮，以及“从列表中移除”。封面上的相机图标可以把自动获取的照片换成你自己的。',
  'help.guide.place-detail.result': '点击“编辑”，就能直接在面板里修改名称、分类、标签、地址、坐标、描述和链接。',
  'help.guide.place-detail.tip.1':
    '地点没有自己的图片时，封面会自动获取。你自己上传的图片可以是 JPG、PNG、GIF、WebP 或 HEIC，最大 20 MB。相机旁的垃圾桶图标可恢复自动获取的照片。',
  'help.guide.place-detail.tip.2':
    '包括你在内，每位成员都可以在状态下给出星级评分，筛选行中的“评分”筛选使用的是平均分。',
  // labels
  'help.guide.labels.title': '用标签给地点分组',
  'help.guide.labels.goal': '除了共用的分类之外，还可以给列表加上它自己的标签，例如街区或天数。',
  'help.guide.labels.step.1':
    '点击地图上方标签旁的“添加标签”（列表里有标签后变为“管理标签”）。没有显示地图时，这个按钮在筛选行的末尾。',
  'help.guide.labels.step.2':
    '输入名称，选择颜色，然后点击“添加标签”。在同一个对话框中，还可以重命名、改色或删除已有的标签。',
  'help.guide.labels.step.3':
    '打开“选择”，勾选地点，点击选择栏中的“分配标签”，再选标签并点击“分配标签”确认。单个地点也可以在详情页点“编辑”来添加标签。',
  'help.guide.labels.step.4':
    '点击地图上方的一个或多个标签，列表和地图就只显示带有其中任一标签的地点。再点一次标签，即可从筛选中取消。',
  'help.guide.labels.result': '带标签的地点会在行上显示标签；标签筛选对每位成员都可用，包括只能查看的成员。',
  'help.guide.labels.tip.1': '标签属于创建它们的那个列表。把地点移到另一个列表后，它的标签会被删除。',
  'help.guide.labels.tip.2': '管理和分配标签需要该列表的编辑权限。',
  // filter-select
  'help.guide.filter-select.title': '筛选和选择地点',
  'help.guide.filter-select.goal': '筛选列表，并一次性修改多个地点。',
  'help.guide.filter-select.step.1':
    '使用筛选行中的下拉菜单：状态、分类、最低评分和排序方式。状态和分类会显示每个选项对应多少个地点。',
  'help.guide.filter-select.step.2':
    '点击下拉菜单之后的复选框图标，即“选择”。每一行都会出现一个复选框，同时出现选择栏。',
  'help.guide.filter-select.step.3':
    '勾选地点，或用“全选”选中筛选结果中的全部地点，然后选择“分配标签”“移动到列表”“复制到列表”“复制到行程”或“删除”。只有列表的所有者或管理员可以使用移动和删除。',
  'help.guide.filter-select.result': '所有操作会一次性应用到选中的全部地点。右侧的 × 用来退出选择模式。',
  'help.guide.filter-select.tip.1':
    '“全选”只会选中符合当前筛选条件的地点。想对所有“想去”的地点操作时，先筛选出“想去”，再点击“全选”。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '把地点复制到旅行中',
  'help.guide.copy-to-trip.goal': '把已保存的地点作为停留点加到你的某次旅行中。',
  'help.guide.copy-to-trip.step.1': '开启“选择”并勾选地点，或者打开某个地点，使用详情面板上的“复制到行程”。',
  'help.guide.copy-to-trip.step.2': '点击选择栏里的“复制到行程”。',
  'help.guide.copy-to-trip.step.3': '选择旅行。列表很长时，可以用搜索框筛选。',
  'help.guide.copy-to-trip.result':
    '地点会连同名称、描述、分类、备注、价格、坐标、照片和标签一起添加到该旅行的地点列表中。收藏里的内容不会有任何变化。',
  'help.guide.copy-to-trip.tip.1': '共享列表的查看者也可以这样操作。这只是从列表中复制地点，不会改动列表本身。',
  // share-list
  'help.guide.share-list.title': '与他人共享列表',
  'help.guide.share-list.goal': '与这台 TREK 上的其他人实时共同规划一个列表。',
  'help.guide.share-list.step.1': '点击你的列表顶部区域的“共享”。',
  'help.guide.share-list.step.2': '选择用户和角色：“查看者”“编辑者”或“管理员”。',
  'help.guide.share-list.step.3': '点击“发送邀请”。在对方于列表侧栏或通知中接受邀请之前，该成员显示为待处理。',
  'help.guide.share-list.result':
    '对方接受邀请后，这个列表会出现在他们的“已共享”下，之后的每次改动都会实时同步。你仍然可以在同一个对话框中修改成员及其角色。',
  'help.guide.share-list.tip.1':
    '“查看者”可以查看、评分，并把地点复制到自己的旅行中。“编辑者”可以添加和编辑地点和标签。“管理员”还可以移动和删除。',
  'help.guide.share-list.tip.2': '只有所有者可以邀请和移除成员；成员可以自己退出共享列表。',
  // export-list
  'help.guide.export-list.title': '把列表导出为文件',
  'help.guide.export-list.goal': '把列表发给使用另一台 TREK 服务器的人，或在地图应用中打开。',
  'help.guide.export-list.step.1': '点击列表顶部区域的“导出”。',
  'help.guide.export-list.step.2':
    '选“TREK 列表”，可在另一台 TREK 中使用，并保留标签和状态；选 GPX，则适用于 OsmAnd、Organic Maps、Garmin 以及其他能读取航点的应用。',
  'help.guide.export-list.result': '文件会开始下载。共享列表的任何成员都可以导出。',
  'help.guide.export-list.tip.1': '没有坐标的地点无法成为 GPX 航点，会被略过，TREK 会告诉你略过了多少个。',
  'help.guide.export-list.tip.2':
    '评分、成员和上传的照片不会导出，这是有意为之：它们属于当前这个 TREK，而不属于列表本身。',
  // import-file
  'help.guide.import-file.title': '从文件导入列表',
  'help.guide.import-file.goal': '导入 TREK 列表文件或 GPX 文件，可以作为新列表，也可以并入已有列表。',
  'help.guide.import-file.step.1': '点击列表栏中“新建列表”旁边带上传箭头的导入按钮。',
  'help.guide.import-file.step.2':
    '选择文件。TREK 在导入任何内容之前，会先显示文件里有什么：名称、地点数量和标签数量。',
  'help.guide.import-file.step.3':
    '保留“新建列表”，需要的话修改名称，然后点击“导入”。也可以选择“添加到列表”，把地点放进你可以编辑的列表，再点击“添加到列表”。',
  'help.guide.import-file.result':
    '列表会打开，里面是导入的地点。导入到已有列表只会添加地点，列表中已有的地点会保留原来的状态、备注和标签。',
  'help.guide.import-file.tip.1':
    '从 GPX 导入时，每个有名称的航点都会成为一个地点；轨迹是线条，会被略过，预览中会说明略过了多少个点。',
  'help.guide.import-file.tip.2':
    '既不是 TREK 列表也不是 GPX 的文件会被拒绝，TREK 会告诉你原因。如果个别地点无法读取，只会跳过该地点，不会影响整个文件。',
  // edit-list
  'help.guide.edit-list.title': '编辑或删除列表',
  'help.guide.edit-list.goal': '修改列表的名称、颜色、封面、描述或链接，或删除列表。',
  'help.guide.edit-list.step.1': '点击列表顶部区域的“编辑”。只有所有者能看到它。',
  'help.guide.edit-list.step.2':
    '按需修改后点击“保存”。左下角的垃圾桶图标即“删除列表”，确认后会删除该列表及其所有地点。',
  'help.guide.edit-list.result': '顶部标题区会立即显示新的颜色、封面和描述。',
  'help.guide.edit-list.tip.1': '删除列表后无法撤销。如果想留一份副本，请先导出。',
  // all-saved
  'help.guide.all-saved.title': '搜索整个地点库',
  'help.guide.all-saved.goal': '一次查看你拥有的所有列表中的地点。',
  'help.guide.all-saved.step.1':
    '点击列表栏中的“全部已保存”。它会把你拥有或共同拥有的所有列表中的地点汇总在一个视图里。',
  'help.guide.all-saved.step.2':
    '在地图上方的“搜索地点”中输入内容，像在其他列表中一样使用筛选。“选择”在这里同样可用：可以跨列表移动、复制、复制到旅行或删除。',
  'help.guide.all-saved.result':
    '这个视图把你所有已保存的地点放在一起显示。这里不能添加或导入地点，因为没有一个确定的列表可以存放它们。',
  'help.guide.all-saved.tip.1': '标签和保存的路线属于某一个列表，所以“全部已保存”里没有这两项。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '旅程',
  'help.ctx.journey.summary':
    '“旅程”是以照片为主的旅行日志。每段旅程都关联一次或多次旅行，你按天往里写日志，每条日志可以有文字、照片、心情和天气。这个页面列出你的旅程，打开其中一段即可开始写。',
  'help.ctx.journey.bullet.1':
    '顶部的横幅显示正在进行的旅程，或你最近的一个旅程，以及它的条目、照片和地点数量。点击“继续写作”会打开到今天。旅行刚结束时，上方还会出现“旅行刚结束”横幅，可以把该旅行变成旅程。',
  'help.ctx.journey.bullet.2':
    '“所有旅程”下方是旅程卡片，每个旅程一张，显示封面、状态、日期和数量；横幅中展示的旅程不会在这里重复出现。点击卡片即可打开。',
  'help.ctx.journey.bullet.3': '网格中的最后一张卡片“创建新旅程”，可以根据你的旅行开始一段新旅程。',
  // create-journey
  'help.guide.create-journey.title': '创建旅程',
  'help.guide.create-journey.goal': '为一次旅行新建一本日记，旅行中的地点会自动作为建议添加进来。',
  'help.guide.create-journey.step.1': '点击网格中最后一张卡片“创建新旅程”。',
  'help.guide.create-journey.step.2':
    '给它起个名字，需要的话再加一个副标题，然后勾选它所属的旅行。计数器会显示将添加多少个地点。',
  'help.guide.create-journey.step.3': '点击“创建旅程”。',
  'help.guide.create-journey.result':
    '旅程日志随即打开。所关联旅行的每个地点都会作为建议出现在时间线上，计划在哪几天就出现几次。你可以为每一条建议写一条日志。',
  'help.guide.create-journey.tip.1': '之后还可以在“旅程设置”里关联更多旅行。',
  'help.guide.create-journey.tip.2': '也可以创建不含旅行的旅程，这时需要手动添加日志。',
  // open-journey
  'help.guide.open-journey.title': '打开旅程',
  'help.guide.open-journey.goal': '打开一本日记，了解它会定位到哪里。',
  'help.guide.open-journey.step.1': '点击一张卡片。每张卡片都显示封面、日期，以及这个旅程包含多少条目、照片和地点。',
  'help.guide.open-journey.result':
    '进行中的旅程会打开到今天；如果今天还没写，就打开到今天之前的最后一条。已结束的旅程从头开始打开。',
  'help.guide.open-journey.tip.1': '除非你在“旅程设置”里另外指定，否则封面就是旅程的第一张照片。',
  // continue-writing
  'help.guide.continue-writing.title': '继续写进行中的旅程',
  'help.guide.continue-writing.goal': '直接打开你正在经历的旅程的今天这一页。',
  'help.guide.continue-writing.step.1':
    '点击顶部横幅里的“继续写作”。横幅显示的是进行中的旅程，如果没有进行中的，则显示最近的一个。',
  'help.guide.continue-writing.result': '日记会打开到今天这一天；如果还没有写过内容，则打开到今天之前的最后一条记录。',
  'help.guide.continue-writing.tip.1':
    '旅行刚结束时，这个横幅上方会出现“旅行刚结束”横幅：“创建旅程”会以勾选该旅行的状态开始创建旅程，“忽略”则在这个浏览器中隐藏该提示。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '旅程日志',
  'help.ctx.journey-detail.summary':
    '一个打开的旅程：左侧是按天排列的时间线，右侧是地图，可切换“计划”、你的记录、条目和照片图层。标题栏显示数量、工作室、建议开关，以及用于“旅程设置”的 ⋯；其下方的工具栏用来添加条目。',
  'help.ctx.journey-detail.bullet.1':
    '顶部：返回箭头和状态徽章、封面、标题和副标题，以及天数、地点、条目和照片的数量。右侧是工作室、用来隐藏或显示建议的眼睛图标，还有通向“旅程设置”的 ⋯。',
  'help.ctx.journey-detail.bullet.2':
    '工具栏：“时间线”和“图库”标签页、“在这段旅程中搜索”以及“添加条目”。在“图库”中，“上传”会取代“添加条目”。',
  'help.ctx.journey-detail.bullet.3':
    '“时间线”：每天一个分区，标有天数编号、地点数量，以及用于在当天添加条目的 +。其下是带照片、心情、天气和故事的条目卡片，以及来自旅行的虚线建议卡片，每张建议卡片都有一个用于忽略的 ×。',
  'help.ctx.journey-detail.bullet.4':
    '地图：顶部的图层栏可切换“计划”（空心图钉和旅行的虚线 GPX 路线）、“记录”（来自 Dawarich 的实线路线）、“条目”（按当天颜色着色的图钉，按日期顺序用细虚线连接）和“照片”。旁边的 (i) 解释每种标记。',
  'help.ctx.journey-detail.bullet.5':
    '“旅程设置”（⋯）：封面、名称和副标题、状态、GPX 轨迹、已记录的日子、根据照片定位的地点、条目字段、已忽略的建议、已同步的旅行、贡献者以及旅行中哪些成员可以加入、公开分享、归档和删除。',
  'help.ctx.journey-detail.bullet.6':
    '在较长的时间线底部，你会看到“回到顶部”、可跳转到任意一天或条目的天数计数，以及“跳到最后一条”。',
  // add-entry
  'help.guide.add-entry.title': '写一条日志',
  'help.guide.add-entry.goal': '添加某一天的故事，包括标题、正文、心情和天气。',
  'help.guide.add-entry.step.1': '点击工具栏中的“添加条目”，或点击某一天标题右端的 +，直接从那一天开始写。',
  'help.guide.add-entry.step.2':
    '给这条日志起个标题，再写下正文。文字上方的工具栏可以用 Markdown 添加粗体、斜体、标题、引用、链接和列表。',
  'help.guide.add-entry.step.3': '在右栏核对日期和时间，搜索地点或使用当前位置，再选择心情和天气。',
  'help.guide.add-entry.step.4': '点击“保存”。',
  'help.guide.add-entry.result':
    '条目会出现在时间线中它所属的那一天，并在地图上显示为一枚图钉。页眉中的数量也会随之更新。',
  'help.guide.add-entry.tip.1': '在建议里写作用的是同一个编辑器，地点已经帮你填好。',
  'help.guide.add-entry.tip.2':
    '带地点的条目有“不计入路线”选项：条目仍保留在日志中，但不计入距离和国家数，也不会显示在工作室的地图上。',
  // entry-photos
  'help.guide.entry-photos.title': '给条目添加照片和视频',
  'help.guide.entry-photos.goal': '给某一天添加照片；第一张会成为这条日志的封面。',
  'help.guide.entry-photos.step.1': '点击日志卡片上的 ⋯ 打开菜单，选择“编辑”。',
  'help.guide.entry-photos.step.2':
    '点击“上传照片”并选择文件。“从相册”会使用旅程图库中已有的图片；“外部照片”会在已连接的 Immich 或 Synology 图库中搜索那一天的照片。',
  'help.guide.entry-photos.step.3': '把鼠标悬停在一张图片上，点击“设为第1张”选定封面，然后点击“保存”。',
  'help.guide.entry-photos.result': '照片会显示在卡片和图库中，第一张照片在所有位置都用作缩略图。',
  'help.guide.entry-photos.tip.1': '视频的添加方式相同，支持 mp4、m4v、webm 或 mov，最大 500 MB，会按原样保存。',
  'help.guide.entry-photos.tip.2':
    '来自 iPhone 的 HEIC 文件会在上传时转换为 JPEG，转换后会丢失其中的 GPS 和相机元数据。',
  // suggestions
  'help.guide.suggestions.title': '采用或忽略建议',
  'help.guide.suggestions.goal': '把旅行中的地点变成日志，并忽略你不想写的那些。',
  'help.guide.suggestions.step.1':
    '建议是一张带虚线边框和“添加条目”按钮的卡片：它是关联旅行中某个地点在其计划日期的建议。点击它会打开编辑器，地点和日期已填好。',
  'help.guide.suggestions.step.2':
    '点击不打算采用的卡片右端的 ×。该卡片会从时间线中移除，但不会被删除，旅行同步也不会再次建议它。',
  'help.guide.suggestions.step.3':
    '改主意了？点击标题栏中的 ⋯ 打开“旅程设置”：“找回已忽略的建议”会显示有多少条，并把它们全部找回来。',
  'help.guide.suggestions.result': '时间线上只留下你想写的条目。阅读时，标题栏中的眼睛图标可以一次隐藏所有建议。',
  'help.guide.suggestions.tip.1': '安排在两天里的同一个地点，会在这两天各生成一条建议。',
  'help.guide.suggestions.tip.2': '建议不会计入统计，只有已写的日志才算。',
  // add-on-day
  'help.guide.add-on-day.title': '在更早的日期添加记录',
  'help.guide.add-on-day.goal': '补写已经过去的某一天，而不用事后再修改日期。',
  'help.guide.add-on-day.step.1': '点击该天标题右端的 +。',
  'help.guide.add-on-day.step.2': '编辑器打开时，日期已经设好。像平常一样写好内容，然后点击“保存”。',
  'help.guide.add-on-day.result': '日志会立即加到正确的那一天。',
  'help.guide.add-on-day.tip.1': '要调整一天之内的顺序，把鼠标移到条目上：它左侧会出现“上移”和“下移”。',
  // pros-cons
  'help.guide.pros-cons.title': '添加评价',
  'help.guide.pros-cons.goal': '用哪些很棒、哪些不太好来总结这一天。',
  'help.guide.pros-cons.step.1':
    '在编辑器里，故事下方有“优缺点”。在“优点”或“缺点”中输入一条，再用“再添加一个”写下一条。',
  'help.guide.pros-cons.step.2': '点击“保存”。在卡片上，“显示更多”会把经过和评价展开成两个简短的列表。',
  'help.guide.pros-cons.result': '点赞和差评会显示在故事下方，一眼就能看到。',
  'help.guide.pros-cons.tip.1': '如果某个旅程不需要评价，可以在“旅程设置”的“记录字段”中关闭这一部分。',
  // search-journey
  'help.guide.search-journey.title': '在很长的日记里查找内容',
  'help.guide.search-journey.goal': '不用翻几周的日志，就能找到想要的那一条。',
  'help.guide.search-journey.step.1':
    '在工具栏的“在这段旅程中搜索”里输入。时间线会随输入实时筛选，搜索范围包括标题、故事、地点和标签，不区分重音和大小写。',
  'help.guide.search-journey.step.2': '想直接跳到某一天，点击时间线底部位于“回到顶部”和“跳到最后一条”之间的天数。',
  'help.guide.search-journey.result':
    '时间线会滚动到你选的日期或条目，地图也会移过去。在你清空搜索框之前，只显示匹配的条目。',
  'help.guide.search-journey.tip.1': '进行中的旅程会打开到今天这一页，所以当前页通常已经在视野内。',
  'help.guide.search-journey.tip.2': '标题栏中的眼睛图标会隐藏建议，这样只剩你自己写的条目。',
  // gallery-map
  'help.guide.gallery-map.title': '浏览图库和地图',
  'help.guide.gallery-map.goal': '用图片浏览整个旅程，也可以在地图上查看去过的地点。',
  'help.guide.gallery-map.step.1':
    '在工具栏中切换到“图库”。这里显示所有条目的全部照片，以及直接上传到图库的图片。点击任意一张，即可在灯箱中打开。',
  'help.guide.gallery-map.step.2':
    '右侧的“上传”可以向图库添加图片。如果已连接 Immich 或 Synology，会出现以相册库命名的按钮，可以从中选取照片。',
  'help.guide.gallery-map.result': '图钉带有当天的颜色，并按日期顺序用细虚线连接。地图顶部的图层栏可以切换绘制的内容。',
  'help.guide.gallery-map.tip.1':
    '旅行的 GPX 轨迹以虚线显示在地图的“计划”图层上。“旅程设置”中的“显示所有行程的 GPX 轨迹”可以把它们关掉。',
  'help.guide.gallery-map.tip.2': '“图库”和“地图”都已分享时，带位置信息的图库照片也会显示在公开地图上。',
  // entry-fields
  'help.guide.entry-fields.title': '关闭日志字段',
  'help.guide.entry-fields.goal': '在编辑器中只显示这段旅程用到的字段。',
  'help.guide.entry-fields.step.1': '点击标题右上角的 ⋯，打开“旅程设置”。',
  'help.guide.entry-fields.step.2': '在“记录字段”下，关闭“心情”“天气”或“优点与不足”。',
  'help.guide.entry-fields.result':
    '编辑器里不再显示这些字段。你写过的内容不会丢失：重新打开某个字段后，之前保存的内容会再次显示。分享出去的旅程也会隐藏同样的字段。',
  'help.guide.entry-fields.tip.1': '这些开关是按旅程设置的，所以出差和度假可以各不相同。',
  // link-trip
  'help.guide.link-trip.title': '关联另一个旅行',
  'help.guide.link-trip.goal': '把第二个旅行的地点作为建议添加到日记中。',
  'help.guide.link-trip.step.1': '点击顶部右侧的 ⋯，打开“旅程设置”。',
  'help.guide.link-trip.step.2': '在“已同步的旅行”下，点击“添加旅行”。',
  'help.guide.link-trip.step.3': '按名称或目的地搜索旅行，点击它旁边的“链接”。',
  'help.guide.link-trip.result':
    '旅行的地点会作为建议出现在时间线对应的日期上，并和 GPX 轨迹一起加入地图的“计划”图层。',
  'help.guide.link-trip.tip.1': '已关联旅行旁的垃圾桶会在确认后取消关联，你写的条目会保留。',
  'help.guide.link-trip.tip.2': '有日期的日志只计一次，不管有多少次旅行包含那一天。',
  // share-public
  'help.guide.share-public.title': '公开分享旅程',
  'help.guide.share-public.goal': '给没有 TREK 账号的人一个只读链接。',
  'help.guide.share-public.step.1': '点击顶部的 ⋯ 打开“旅程设置”，滚动到“公开分享”。',
  'help.guide.share-public.step.2': '点击“创建分享链接”。',
  'help.guide.share-public.step.3':
    '选择访客能看到的内容：“时间线”“图库”和“地图”。在“地图”下，“行程计划”会加入计划的地点和路线，“记录的路线”会加入你记录的那几天的路线。点击“复制”把链接复制到剪贴板。',
  'help.guide.share-public.result':
    '拿到链接的人只能看到已启用的部分，其他内容都看不到；你在“记录字段”里关闭的字段在那里也不会显示。',
  'help.guide.share-public.tip.1':
    '只有“图库”和“地图”都开启时，照片才会显示在公开地图上。关闭“地图”后，服务器会在发送照片之前去掉它们的坐标。',
  'help.guide.share-public.tip.2': '点击“复制”旁边的“删除链接”即可停止分享。',
  // contributors
  'help.guide.contributors.title': '共同写作',
  'help.guide.contributors.goal': '让其他同行的旅伴添加他们自己的条目和照片。',
  'help.guide.contributors.step.1': '点击标题栏的 ⋯ 打开“旅程设置”，找到“贡献者”。',
  'help.guide.contributors.step.2': '点击“邀请贡献者”，按名字或邮箱搜索用户。',
  'help.guide.contributors.step.3': '选择“查看者”或“编辑者”，然后点击“邀请”。',
  'help.guide.contributors.result':
    '这段旅程会出现在对方的列表中，他们写的日志会显示他们的名字。要移除贡献者，点击其名字旁边的 ×。',
  'help.guide.contributors.tip.1': '“贡献者”只适用于这台 TREK 上的用户。其他人请用公开链接。',
  // studio
  'help.guide.studio.title': '把旅程排成一本相册',
  'help.guide.studio.goal': '把旅程日志变成可以打印的页面。',
  'help.guide.studio.step.1': '点击页眉中的“Studio”，设计器会在旅程上方打开。',
  'help.guide.studio.step.2': '要返回时，点击顶栏最右端的 ×，就会回到你之前所在的位置。',
  'help.guide.studio.result':
    '侧栏和面板在左侧，跨页在工作台上，属性在右侧。自动排版根据你的条目生成整本书。导出会生成可直接印刷的 PDF。',
  'help.guide.studio.tip.1': 'Studio 需要宽度至少 1024 px 的窗口，手机上不可用。',
  'help.guide.studio.tip.2': '这本书的访问权限与旅程相同：能阅读旅程的人都能打开这本书，能编辑旅程的人都能保存它。',
  // archive-journey
  'help.guide.archive-journey.title': '归档或删除旅程',
  'help.guide.archive-journey.goal': '结束一段已完成的旅程，或将其永久删除。',
  'help.guide.archive-journey.step.1': '点击标题右上角的 ⋯，打开“旅程设置”。',
  'help.guide.archive-journey.step.2':
    '在底部，“归档旅程”会结束该旅程并标记为已归档，“恢复旅程”可以把它恢复。“删除”会在确认后，连同所有记录和照片一起删除。',
  'help.guide.archive-journey.result': '归档后的旅程仍可阅读和分享，只是不再默认打开到今天。',
  'help.guide.archive-journey.tip.1': '删除后无法撤销，但不会影响旅程之前关联的旅行。',
  'help.guide.archive-journey.tip.2': '封面、名称和副标题也在同一个对话框里，位于顶部。',
  'help.guide.journey-status.title': '设置旅程的状态',
  'help.guide.journey-status.goal': '自己把旅程标记为草稿、进行中或已完成，而不是跟随所属旅行的日期。',
  'help.guide.journey-status.step.1': '点击旅程标题右上角的 ⋯，打开“旅程设置”。',
  'help.guide.journey-status.step.2': '在“状态”下选择“草稿”“实时”或“已完成”。选择后立即保存。',
  'help.guide.journey-status.result':
    '旅程会保留你选的状态：“草稿”和“已完成”显示为卡片和标题上的徽章，“实时”的旅程则显示在旅程列表顶部的横幅中。',
  'help.guide.journey-status.tip.1':
    '“自动”会重新按关联旅行的日期来判断。没有关联旅行时，状态为自动的旅程会保持为草稿。',
  'help.guide.journey-status.tip.2': '手动设置的状态会一直保持，直到你再次修改，即使旅行日期有变化也不会改变。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio 把旅程排成可以打印的相册。它在日志上方打开：左侧是侧栏和面板，中间是你正在处理的跨页，右侧是它的属性。自动排版根据你的条目生成第一版草稿，主题给书配上颜色和字体，助手可以和你一起设计页面。之后你可以移动、裁剪、重新设置任何内容的样式，每一步都能撤销。',
  'help.ctx.journey-studio.bullet.1':
    '顶栏：左侧是旅程的封面和名称。右侧依次是还有谁在这本书里以及是否已保存、页面尺寸、撤销、重做、粘贴、自动排版、助手、帮助、导出，以及关闭 Studio 的按钮。',
  'help.ctx.journey-studio.bullet.2':
    '左侧侧栏：页面、内容（旅程的照片和条目）、版式、元素（文字、形状、线条、相框、图标和贴纸）、旅程（由旅程生成的数字、地图、国家和标记），下方单独分开的是主题和图层。',
  'help.ctx.journey-studio.bullet.3':
    '工作台：当前跨页，带有出血和安全边距，下方的缩放栏有适合视图、书本视图和下载此跨页。',
  'help.ctx.journey-studio.bullet.4':
    '右侧属性：所选元素的一切设置，从位置、尺寸和裁剪，到颜色、效果、叠放顺序和锁定。没有选中任何内容时，这里显示页面背景、主题、页码和文档。',
  'help.ctx.journey-studio.bullet.5':
    '这本书的排布和印刷的书一样：封面、与封面内页空白面相对的单独第一页、各个跨页、单独的最后一页和封底。页码从第一页开始计数，按显示的样子印出。',
  'help.ctx.journey-studio.bullet.6':
    '多人可以同时设计：每个人都能看到其他人带名字的指针。如果你保存的版本已被别人修改过，TREK 会提示冲突，而不是覆盖对方的成果。',
  'help.ctx.journey-studio.bullet.7':
    '主题：整本书统一的外观，包括纸张、墨色、三种强调色、字体和装饰图案。与主题关联的元素会在你更换主题时跟着变化。',
  'help.ctx.journey-studio.bullet.8':
    '助手：管理员设置了 AI 后，顶栏的对话气泡会打开助手，与你一起排页面、写图注、调整整本书的样式。它做的每一处改动都是一个可撤销的步骤。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '自动生成整本书',
  'help.guide.studio-auto-layout.goal': '一键根据日志里的条目和照片生成完整的初稿。',
  'help.guide.studio-auto-layout.step.1': '点击顶部栏中的 Auto layout。',
  'help.guide.studio-auto-layout.step.2':
    '选择“整本书”：会替换所有页面，但保留你的标题和页面设置。“本页”只重建屏幕上显示的这个跨页，而且只有在由条目生成的跨页上才可用。',
  'help.guide.studio-auto-layout.step.3': '翻看 Pages 侧栏。如果你更喜欢之前的版本，点击 Undo 即可撤销整个排版。',
  'help.guide.studio-auto-layout.result':
    '每条日志生成一个跨页，按顺序排列，照片、标题和文字都已放好。在你编辑之前，每个元素都与对应的日志保持关联并随之更新。',
  'help.guide.studio-auto-layout.tip.1': '这两项操作都可以像普通步骤一样撤销，放心试。',
  'help.guide.studio-auto-layout.tip.2':
    '自动布局把元素关联到日志后，你修改那条日志时，元素会同步更新。在“属性”中修改该元素后，这个关联就会断开。',
  // studio-pages
  'help.guide.studio-pages.title': '添加、移动和删除跨页',
  'help.guide.studio-pages.goal': '一页一页地编辑这本书。',
  'help.guide.studio-pages.step.1':
    '在侧栏打开页面。缩略图按顺序显示整本书：封面、第一页、各个跨页、最后一页和封底。第一页和最后一页画在各自封面内页空白面的旁边，就像装订好的书翻开时那样。',
  'help.guide.studio-pages.step.2':
    '底部的“添加页面”会在最后一页之前添加一个新跨页。两张缩略图之间的 + 会在该位置插入一个跨页。',
  'help.guide.studio-pages.step.3':
    '鼠标悬停在缩略图上，就能看到它的操作：“前移”“后移”“复制页面”和“删除页面”。点击缩略图，即可在工作台上打开该跨页。',
  'help.guide.studio-pages.result': '封面、第一页、最后一页和封底保持原位，新跨页总是添加到它们之间。',
  'help.guide.studio-pages.tip.1': '顶部栏的“书籍视图”以成册的纸张形式显示整本书，也就是装订后的样子。',
  'help.guide.studio-pages.tip.2': '页码在“属性”的“文档”下开启，此时不要选中任何对象。',
  // studio-layouts
  'help.guide.studio-layouts.title': '为跨页应用版式',
  'help.guide.studio-layouts.goal': '为跨页套用一组现成的照片框和文字框排版。',
  'help.guide.studio-layouts.step.1':
    '在侧栏打开版式。设计好的页面排在最前：套用了本书主题的整套封面和跨页，样式标签可以把它们筛选为某一种风格。我的版式和内置排在它们下面，使用同样的网格。',
  'help.guide.studio-layouts.step.2':
    '点击其中一个。工作台上的跨页会换成这个版式的相框，你已有的照片和文字会放进这些相框里。',
  'help.guide.studio-layouts.result': '空相框是内容的占位：把照片从“内容”拖到相框上，或使用“添加到此页”。',
  'help.guide.studio-my-layouts.title': '把页面保存为你自己的版式',
  'help.guide.studio-my-layouts.goal': '重复使用你在书中其他页面排好的布局。',
  'help.guide.studio-my-layouts.step.1': '把一个页面排成你喜欢的样子，然后在侧栏打开版式。',
  'help.guide.studio-my-layouts.step.2': '点击我的版式下的将此页面保存为版式。这个页面会作为一张卡片出现在列表中。',
  'help.guide.studio-my-layouts.tip.1':
    '在另一个页面点击你的版式，就能用同样的方式排好那一页，保留它自己的照片和文字。',
  'help.guide.studio-my-layouts.result':
    '你的版式会随书一起保存，并出现在同类页面上：封面的版式用于封面，跨页的版式用于跨页。',
  'help.guide.studio-layouts.tip.1': '套用版式和其他操作一样，可以撤销。',
  // studio-content
  'help.guide.studio-content.title': '把照片和日志放到页面上',
  'help.guide.studio-content.goal': '把旅程中自己的照片和记录添加到跨页上。',
  'help.guide.studio-content.step.1': '在侧栏中打开 Content。Photos 列出旅程的所有照片，Entries 列出带文字的条目。',
  'help.guide.studio-content.step.2':
    '把照片拖到版面或空白框上，或点击下方的“添加到此页”。“上传照片”会添加还不在旅程中的图片，“从 Immich”或“从 Synology”则从已连接的照片库中选取。',
  'help.guide.studio-content.step.3':
    '在条目下方，Title、Story 和 Place 会把对应的文字作为文字元素放到页面上。日期和坐标会作为标记添加，条目的照片也列在这里。',
  'help.guide.studio-content.result': '拖入的照片会变成照片元素。文字在你编辑之前一直与日志保持关联。',
  'help.guide.studio-theme.title': '为整本书选一个主题',
  'help.guide.studio-theme.goal': '一次设置整本书的颜色和字体。',
  'help.guide.studio-theme.step.1': '在侧栏打开主题。每张卡片把一个主题显示成小小的页面：它的纸张、字体和三种强调色。',
  'help.guide.studio-theme.step.2':
    '点击一个主题试用。在卡片下方，你可以修改它的配色、选择其他字体，并挑选装饰图案和装饰元素。',
  'help.guide.studio-theme.step.3': '点击应用到整本书，或者点击应用到此页，只作用于屏幕上的这个跨页。',
  'help.guide.studio-theme.tip.1':
    '与主题关联的元素会采用主题的颜色和字体，并在你更换主题时跟着变化。同时重新设置未关联元素的样式会先关联其余的元素。',
  'help.guide.studio-theme.tip.2': '从照片取色会根据旅程的图片生成一套配色。',
  'help.guide.studio-theme.result': '书中所有已关联的颜色和字体会同时改变，应用主题是一个可撤销的步骤。',
  'help.guide.studio-content.tip.1': '“内容”顶部的搜索框会同时筛选两个列表。',
  'help.guide.studio-content.tip.2': '把桌面上的文件拖到工作台上时，TREK 会一步完成上传和放置。',
  // studio-elements
  'help.guide.studio-elements.title': '添加文字、形状、图标和贴纸',
  'help.guide.studio-elements.goal': '除了照片和文字故事，再为跨页添加一些装饰。',
  'help.guide.studio-elements.step.1': '在侧栏打开元素。可添加的内容分为六个标签：文字、形状、线条、相框、图标和贴纸。',
  'help.guide.studio-elements.step.2':
    '点击一种文字样式或设计好的标题、形状、线条、空相框、图标或贴纸。每一项都会放在跨页中央，之后你可以再移动它。',
  'help.guide.studio-elements.result': '双击文字元素即可输入文字；“属性”里可以设置字体、字重、字号、间距和对齐方式。',
  'help.guide.studio-stickers.title': '用贴纸装饰',
  'help.guide.studio-stickers.goal': '添加插画，从地标和美食到动物和箭头。',
  'help.guide.studio-stickers.step.1': '在侧栏打开元素，选择贴纸。',
  'help.guide.studio-stickers.step.2': '搜索一个词或浏览各个货架，然后点击一张贴纸，把它放到跨页上。',
  'help.guide.studio-stickers.tip.1': '选中贴纸后，属性可以为它的各个部分重新着色，也可以镜像翻转。',
  'help.guide.studio-stickers.result': '贴纸是矢量绘制的，所以无论放多大都保持清晰。',
  'help.guide.studio-elements.tip.1': '相框是空的照片位，之后再把图片放进去即可。',
  // studio-travel
  'help.guide.studio-travel.title': '添加地图、数字、国家和标记',
  'help.guide.studio-travel.goal': '把旅程本身变成页面上设计好的元素。',
  'help.guide.studio-travel.step.1': '在侧栏打开旅程。可添加的内容分为四个标签：数字、地图、国家和标记。',
  'help.guide.studio-travel.step.2':
    '每张卡片都用旅程自己的数据，按主题的颜色展示元素：汇总可以是海报、车票、路牌或里程表，地图可以带编号的停留点或裁成某个国家，国家可以是邮戳、明信片或图钉，日期或距离可以是印章、标签或丝带。',
  'help.guide.studio-travel.step.3': '点击一张卡片。元素会放在跨页中央，之后你可以移动它并调整大小。',
  'help.guide.studio-travel.result':
    '元素会出现在跨页上。属性可以改变它的外观，旅程发生变化时，每个数字、地图和国家都会随之更新。',
  'help.guide.studio-text-effects.title': '为文字添加效果',
  'help.guide.studio-text-effects.goal': '给标题加上描边、阴影、弧形，或者用图案填充文字。',
  'help.guide.studio-text-effects.step.1': '点击页面上的文字元素将其选中。',
  'help.guide.studio-text-effects.step.2':
    '在属性中打开效果，添加描边、阴影或高亮，也可以用渐变或图案填充文字。位置可以把文字行弯成弧形，并让它适应文本框。',
  'help.guide.studio-text-effects.tip.1': '适应会缩小文字直到放进文本框，所以很长的标题也不会溢出。',
  'help.guide.studio-text-effects.result': '效果与文字一起绘制，印刷出来和屏幕上一样。',
  'help.guide.studio-background.title': '更改页面背景',
  'help.guide.studio-background.goal': '给页面涂上纯色、渐变或图案，或者在下面铺一张照片。',
  'help.guide.studio-background.step.1': '点击页面的空白处，让任何内容都不被选中。页面背景位于属性的顶部。',
  'help.guide.studio-background.step.2': '选择纸张、纯色、渐变或图案并挑一个颜色，或在照片作背景下点击一张照片。',
  'help.guide.studio-background.tip.1': '应用到所有页面会让整本书的每一页都使用同一个背景。',
  'help.guide.studio-background.result': '背景会延伸到出血区，所以会印到页面边缘。',
  'help.guide.studio-layers.title': '用图层排列、隐藏和锁定',
  'help.guide.studio-layers.goal': '按叠放顺序查看跨页上的所有内容，并在那里操作。',
  'help.guide.studio-layers.step.1': '在侧栏打开图层。列表顶部是页面的最前面。',
  'help.guide.studio-layers.step.2':
    '拖动一行来调整叠放顺序，用眼睛图标隐藏元素，用锁定让它固定不动。选中多个后编组，就能一起移动。',
  'help.guide.studio-layers.tip.1': '双击一行，可以给元素起一个自己的名字。',
  'help.guide.studio-layers.tip.2': '隐藏的元素不会出现在 PDF 中。',
  'help.guide.studio-layers.result': '内容很多的页面也容易编辑，已经完成的部分不会被误移动。',
  'help.guide.studio-travel.tip.1':
    '在地图下，停留点列出路线上的每一个停留点。关掉某一个，就能把它从地图和数字中排除，例如你的出发机场。',
  'help.guide.studio-travel.tip.2':
    '国家地图只显示该国的停留点，所以即使旅程以一次长途飞行开始，这个国家也会铺满整个页面。',
  // studio-properties
  'help.guide.studio-properties.title': '编辑选中的元素',
  'help.guide.studio-properties.goal': '用检查器移动、裁剪元素，设置样式并调整层叠顺序。',
  'help.guide.studio-properties.step.1':
    '点击跨页上的一个元素。周围会出现用于调整大小和旋转的控制点，拖动元素即可移动。',
  'help.guide.studio-properties.step.2':
    '右侧的 Properties 显示所选对象的设置：位置和大小、带焦点的 Crop（焦点决定画面中保留哪一部分）、Fill 或 Fit、Look 滤镜、Corner 圆角、“相框”样式、叠放顺序和 Lock。',
  'help.guide.studio-properties.step.3': '“复制”和 Delete 位于检查器顶部。顶部栏的 Undo 可以撤销其中任何一项更改。',
  'help.guide.studio-properties.result':
    '页面上无法选中或移动已锁定的元素。这样在你调整其他元素时，已经完成的版面不会被误改。',
  'help.guide.studio-properties.tip.1': '按住 Shift 点击可以选中多个元素，检查器会同时编辑它们。',
  'help.guide.studio-properties.tip.2':
    '如果你编辑了自动布局放置的元素，它就不再与对应的日志关联，之后日志有改动也不会同步到它。',
  // studio-format
  'help.guide.studio-format.title': '选择页面格式',
  'help.guide.studio-format.goal': '在搭建版面之前，先设定这本书的印刷尺寸。',
  'help.guide.studio-format.step.1': '点击顶栏中编辑工具旁边的页面尺寸，那里显示尺寸的名称和形状。',
  'help.guide.studio-format.step.2':
    '可以选择 Square 21 × 21 cm、Square 30 × 30 cm、横向或纵向的 A4 或 A5，也可以用毫米输入自定义的宽度和高度。出血和安全边距在下方设置。',
  'help.guide.studio-format.result': '每个跨页都按该尺寸绘制，默认出血 3 mm，安全边距 5 mm。',
  'help.guide.studio-format.tip.1': '请先修改格式，再运行 Auto layout。Auto layout 会使用运行时当前设置的格式。',
  'help.guide.studio-format.tip.2': '向印刷厂询问他们要求的出血和安全边距，再填入这些数值。',
  // studio-export
  'help.guide.studio-export.title': '把书导出为 PDF',
  'help.guide.studio-export.goal': '得到一个可直接印刷的文件，或一个用于屏幕阅读的文件。',
  'help.guide.studio-export.step.1': '点击顶部栏中的 Export。',
  'help.guide.studio-export.step.2':
    '选择“单页”，每张纸一页，按阅读顺序排列，印刷厂需要的就是这种；或者选择“跨页”，像书翻开时那样一次两页。“裁切标记”会在每条边上加上出血，并标出裁切位置。',
  'help.guide.studio-export.step.3': '点击“打印视图”，浏览器会打开这些页面。选择“另存为 PDF”即可生成文件。',
  'help.guide.studio-export.result': '生成一个 PDF，页数与对话框提示的一致，页面格式就是你设置的格式。',
  'help.guide.studio-export.tip.1': '和 Studio 本身一样，只能在桌面端生成 PDF。',
  'help.guide.studio-export.tip.2': '校样请导出不带裁切标记的“跨页”，交给印刷厂请导出带裁切标记的“单页”。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '在另一本书中重用跨页',
  'help.guide.studio-spread-file.goal': '把你喜欢的设计从一个旅程的书复制到另一个旅程。',
  'help.guide.studio-spread-file.step.1':
    '跨页在工作区中打开后，点击缩放条右端的“下载此跨页”。文件中只包含设计，不包含照片。',
  'help.guide.studio-spread-file.step.2': '在另一本书中打开 Pages，点击“添加页面”旁边的“导入”，然后选择该文件。',
  'help.guide.studio-spread-file.result': '跨页会连同相框和文字样式一起导入。把新旅程的照片放进这些相框里即可。',
  'help.guide.studio-spread-file.tip.1': '如果文件不是跨页设计，TREK 会拒绝导入并说明原因。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '设置',
  'help.ctx.settings.summary':
    '你的个人设置，左侧边栏里每个主题一个标签页。大多数开关一拨动就会生效，带“保存”按钮的表单则要点击“保存”才会保存。这里的任何设置都不会影响其他人的 TREK。',
  'help.ctx.settings.bullet.1':
    '左侧边栏：显示、外观、地图、通知、集成、离线和账户。有插件启用后会出现“插件”。只要运营者没有隐藏，就会有“关于”。版本号显示在底部。',
  'help.ctx.settings.bullet.2':
    '先打开的是“显示”。其中有 TREK 启动时打开的内容、语言、地点名称的语言、单位、时间格式、每周起始日和显示货币，以及行程地图的行为。“外观”包含主题、颜色、可读性、文字大小和仪表盘组件。',
  'help.ctx.settings.bullet.3':
    '“地图”设置地图引擎及其样式；“通知”设置哪些事件发送到哪个渠道；“集成”用于连接照片库、AirTrail、Dawarich 和 wanderer，也包含 API 密钥和 MCP；“离线”设置这台设备保存哪些内容。',
  'help.ctx.settings.bullet.4': '“账户”包含你的个人资料、密码、双因素认证、通行密钥，以及删除账号的选项。',
  'help.ctx.settings-display.title': '显示',
  'help.ctx.settings-display.summary':
    'TREK 启动时打开什么、使用的语言和单位，以及行程地图和预订的行为。每次修改都会立即生效。',
  'help.ctx.settings-display.bullet.1':
    '“启动”：“启动页面”可选择打开“仪表盘”或“进行中的旅行”；选择“进行中的旅行”后，“启动标签页”决定该旅行默认打开哪个标签页。',
  'help.ctx.settings-display.bullet.2':
    '“语言与地区”：“显示货币”（或选“行程货币”则不换算）、“语言”、“地点名称”、“温度单位”、“距离单位”、“时间格式”和“每周开始于”。',
  'help.ctx.settings-display.bullet.3':
    '旅行与地图：打开地点方式、每日标题中日期在前、预订路线标签、始终显示预订路线、未规划地点使用紧凑标记、在地图上探索地点、隐藏预订编号和从住宿地优化路线。',
  'help.ctx.settings-appearance.title': '外观',
  'help.ctx.settings-appearance.summary':
    'TREK 在这个账户上的外观：浅色或深色、强调色、玻璃效果和动态效果、文字大小，以及仪表盘显示哪些组件。所有设置即时生效，并同步到你登录的每台设备。',
  'help.ctx.settings-appearance.bullet.1':
    '主题：“颜色模式”（浅色、深色或自动）、“配色方案”，选择“自定义”后还可以分别为浅色和深色模式设置自己的强调色，并有对比度检查。',
  'help.ctx.settings-appearance.bullet.2':
    '“可读性”，标有“实验性”：“透明效果”“减少动态效果”“布局密度”，以及“文字大小”，其中“全部”有一个滑块，“大”“中”“普通”和“小”各有一个滑块。',
  'help.ctx.settings-appearance.bullet.3':
    '仪表盘组件：“桌面端”（顶部摘要下方、右侧栏）和“移动端”（顶部摘要下方、页面底部）各有独立的开关。',
  'help.ctx.settings-appearance.bullet.4': '卡片下方的“恢复默认”会把整个标签页恢复为默认值。',
  'help.ctx.settings-map.title': '地图',
  'help.ctx.settings-map.summary':
    '行程规划器和旅程日志的地图用哪个引擎绘制，以及采用什么样式。Leaflet 是经典的栅格地图；Mapbox GL 用你自己的令牌增加 3D 建筑和地形；MapLibre GL 不需要令牌，绘制 OpenFreeMap 矢量瓦片。足迹始终使用 Leaflet。',
  'help.ctx.settings-map.bullet.1':
    '“地图提供商”：Leaflet、Mapbox GL（“实验性”）或 MapLibre GL，每个选项都有一行简短说明。',
  'help.ctx.settings-map.bullet.2':
    'Leaflet 使用“地图模板”和“CARTO API 密钥”；两种 GL 引擎使用“地图样式”，Mapbox GL 另外还需要“Mapbox 访问令牌”。',
  'help.ctx.settings-map.bullet.3':
    '仅限 Mapbox GL：3D 建筑和地形与高画质模式。“保存地图”上方有实时预览，点击“保存地图”才会保存你的选择。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'TREK 在应用之外如何联系你。顶部的表格每个事件一行、每个渠道一列，决定什么内容发到哪里。下面是 webhook、ntfy、本设备推送以及各插件渠道的卡片。',
  'help.ctx.settings-notifications.bullet.1': '“通知”：按渠道开启或关闭每个事件。锁表示管理员已为所有人关闭该事件。',
  'help.ctx.settings-notifications.bullet.2': 'Webhook URL：Discord、Slack 或自定义的 webhook，带有“测试”和“保存”。',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy：“Ntfy 主题”，以及可选的“Ntfy 服务器 URL”和访问令牌，配有“测试”和“保存”。',
  'help.ctx.settings-notifications.bullet.4':
    '此设备上的推送通知：“为此设备开启”只对当前浏览器有效；“发送测试”会发一条测试通知。插件渠道在配置好之前会显示“去配置”。',
  'help.ctx.settings-integrations.title': '集成',
  'help.ctx.settings-integrations.summary':
    '所有从外部连接到 TREK 的内容：用于旅程日志的照片库、用于航班的 AirTrail、用于查看实际行踪的 Dawarich、用于路线的 wanderer、供其他软件使用的只读 API 密钥，以及供 AI 客户端使用的 MCP。与其他服务的连接，只有在管理员启用后才会显示。',
  'help.ctx.settings-integrations.bullet.1':
    'Immich 和 Synology Photos、AirTrail、Dawarich 和 wanderer：每张卡片都有地址和密钥、“保存”和“测试连接”，以及“已连接”或“未连接”徽章。',
  'help.ctx.settings-integrations.bullet.2':
    'API 密钥：用于公共 API 的只读密钥，每个都限定在你选择的范围内，旁边还有可复制的端点。',
  'help.ctx.settings-integrations.bullet.3':
    '“MCP 配置”：“MCP 端点”，以及“OAuth 2.1 客户端”下你注册的客户端、可复制的“客户端配置”和带“撤销”按钮的“活跃的 OAuth 会话”。',
  'help.ctx.settings-integrations.bullet.4': '“API 令牌”：连接 MCP 的旧方式，标有“已弃用”，请改用“OAuth 2.1 客户端”。',
  'help.ctx.settings-offline.title': '离线',
  'help.ctx.settings-offline.summary':
    'TREK 会在这台设备上保存哪些内容，让旅行在没有网络时也能打开；以及离线时的修改与别处的修改发生冲突时会怎么处理。',
  'help.ctx.settings-offline.bullet.1':
    '离线模式：“强制离线模式”会先下载所有内容，之后只使用缓存工作，并把你的更改排入队列。',
  'help.ctx.settings-offline.bullet.2':
    '“为离线做准备”：“下载以供离线使用”会获取旅行数据、文档和地图瓦片，“立即重新同步”则手动再同步一次。',
  'help.ctx.settings-offline.bullet.3':
    '“要离线存储的内容”：“离线存储地图瓦片”，以及每个旅行一个开关。已结束的旅行只有打开开关才会被存储。',
  'help.ctx.settings-offline.bullet.4':
    '“同步冲突”只在有两处更改冲突时才会出现，带有“用我的”“保留对方的”和“发生冲突时”。“离线缓存”统计旅行以及待处理或失败的更改，带有“重试”“放弃”和“清除缓存”。',
  'help.ctx.settings-account.title': '账户',
  'help.ctx.settings-account.summary':
    '你在这个 TREK 上的账户和登录方式：头像、用户名和邮箱、密码、双因素身份验证和通行密钥。“删除账户”在“账户”卡片的底部。',
  'help.ctx.settings-account.bullet.1':
    '“账户”：点击头像上的相机图标上传图片，点红色垃圾桶移除。“用户名”和“邮箱”通过“保存资料”保存。',
  'help.ctx.settings-account.bullet.2':
    '“修改密码”：当前密码、两次输入的新密码（输入时会逐条勾选密码规则），然后点击“更新密码”。如果这个 TREK 只能通过 SSO 登录，就没有这张卡片。',
  'help.ctx.settings-account.bullet.3':
    '使用身份验证器应用和备用代码的“双因素认证 (2FA)”，以及无需密码即可登录的“通行密钥”。',
  'help.ctx.settings-account.bullet.4': '“删除账户”位于“账户”卡片页脚的左侧，需要确认。唯一的管理员不能删除自己。',
  // language-region
  'help.guide.language-region.title': '设置语言、单位和货币',
  'help.guide.language-region.goal': '用你的语言和所在地区的格式使用 TREK。',
  'help.guide.language-region.step.1':
    '在“语言与地区”下，从一排标签中选择“语言”。TREK 会立即切换，你登录的每台设备上都会生效。',
  'help.guide.language-region.step.2': '“地点名称”设置地点搜索、建议和地址所使用的语言，选“与应用相同”则跟随界面语言。',
  'help.guide.language-region.result':
    '日期、距离和金额会按你习惯的格式显示。在“费用”中，金额只是用你的显示货币来显示，录入的金额不会变。',
  'help.guide.language-region.tip.1': '“行程货币”让每个旅行按自己的货币显示，不做换算。',
  'help.guide.language-region.tip.2': '语言也决定了 Vacay 和日记中的星期和月份名称。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '调整行程地图和每日标题',
  'help.guide.travel-map-prefs.goal': '设置行程地图显示什么、每日标题长什么样，对所有旅行都生效。',
  'help.guide.travel-map-prefs.step.1':
    '在“旅行与地图”中，“打开地点方式”用来设置导航按钮直接打开哪个地图应用，选“每次询问”则每次都让你选择应用。“每日标题中日期在前”会让每天的标题以日历日期开头。',
  'help.guide.travel-map-prefs.step.2':
    '“始终显示预订路线”会在地图上画出每个航班、火车和其他预订，“预订路线标签”会在每一端标出车站或机场名称。“未规划地点使用紧凑标记”会把尚未安排到某一天的地点缩小，让已计划的站点更醒目。',
  'help.guide.travel-map-prefs.result': '旅行地图会在每个旅行中使用这些设置，直到你再次修改。',
  'help.guide.travel-map-prefs.tip.1': '这些设置按账户保存，而不是按旅行保存。共享旅行的每位成员看到的是各自的选择。',
  'help.guide.travel-map-prefs.tip.2': '管理员可以为所有人设置默认值；你在这里的设置只对你自己生效。',
  // startup
  'help.guide.startup.title': '选择 TREK 启动时打开的页面',
  'help.guide.startup.goal': '让 TREK 直接打开你最常用的页面，而不是每次都先进仪表盘。',
  'help.guide.startup.step.1': '在“显示”顶部的“启动”下，把“启动页面”设为“仪表盘”或“进行中的旅行”。',
  'help.guide.startup.step.2': '选择“进行中的旅行”后，会出现“启动标签页”：选择该旅行默认打开哪个标签页。',
  'help.guide.startup.result': '下次打开 TREK 时，会直接进入那个页面。',
  'help.guide.startup.tip.1':
    '“进行中的旅行”指今天正在进行的旅行，或最近要开始的下一个旅行，与仪表盘顶部显示的旅行相同。',
  // theme-scheme
  'help.guide.theme-scheme.title': '设置主题和强调色',
  'help.guide.theme-scheme.goal': '让 TREK 使用浅色、深色或跟随设备，并选择你喜欢的颜色。',
  'help.guide.theme-scheme.step.1': '在“主题”下，把“颜色模式”设为“浅色”“深色”或“自动”。“自动”会跟随你的设备。',
  'help.guide.theme-scheme.step.2': '选择一个“配色方案”：默认、高对比度、靛蓝、蓝绿、玫瑰、琥珀、紫罗兰或自定义。',
  'help.guide.theme-scheme.step.3':
    '选择“自定义”后，可以选一个颜色圆点，也可以分别为“浅色”和“深色”设置你自己的强调色。旁边的标签会显示“对比度良好”或“对比度偏低”。',
  'help.guide.theme-scheme.result': '按钮、链接和高亮处处使用这个强调色，在你登录的每台设备上都一样。',
  'help.guide.theme-scheme.tip.1': '导航栏里也有一个浅色和深色的快捷开关，它设置的是同一个主题。',
  'help.guide.theme-scheme.tip.2': '如果默认配色看不太清，请选择“高对比度”配色。',
  // readability
  'help.guide.readability.title': '调整可读性和文字大小',
  'help.guide.readability.goal': '减少玻璃效果和动画，留出更多空间，或把文字调大。',
  'help.guide.readability.step.1':
    '在“可读性”下，“透明效果”会把玻璃质感的面板换成纯色表面，“减少动态效果”会尽量减少动画，“布局密度”可选“舒适”或“紧凑”。',
  'help.guide.readability.step.2':
    '文字大小：拖动“全部”可一次缩放所有文字，也可以分别设置大、中、普通和小。每个大小都有示例，拖动时就能看到效果。',
  'help.guide.readability.result': '更改会立即应用到整个应用，包括地图面板和日志。',
  'help.guide.readability.tip.1':
    '当设备已设为减少动态效果时，TREK 的部分内容本来就会减少动画。“减少动态效果”会减少其余部分的动画。',
  'help.guide.readability.tip.2': '文字大小通过排版层级来应用，所以内容不会被截断；放不下的文字会自动换行。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '选择仪表盘组件',
  'help.guide.dashboard-widgets.goal': '只显示你会用到的组件，电脑端和手机端可以分别设置。',
  'help.guide.dashboard-widgets.step.1':
    '在“仪表盘组件”下，“桌面端”列出“顶部摘要下方”和“右侧栏”的组件。关闭“右侧栏”会隐藏整列，并让仪表盘居中，其中的组件会变灰，直到你重新开启。',
  'help.guide.dashboard-widgets.step.2': '“移动端”有自己的开关，“顶部摘要下方”和“页面底部”，用于手机上的仪表盘。',
  'help.guide.dashboard-widgets.result': '仪表盘会立即变化。如果关闭了右侧边栏，仪表盘内容会居中显示。',
  'help.guide.dashboard-widgets.tip.1': '扩展的小组件只有在管理员开启该扩展时才会出现。',
  'help.guide.dashboard-widgets.tip.2': '仪表盘本身会按设备记住你的网格或列表视图和排序方式。',
  // map-provider
  'help.guide.map-provider.title': '选择地图引擎和样式',
  'help.guide.map-provider.goal': '在经典地图、矢量瓦片和 Mapbox 的 3D 地图之间切换。',
  'help.guide.map-provider.step.1':
    '在“地图提供商”下选择：Leaflet 是经典的 2D 地图，可用任意栅格瓦片；Mapbox GL 使用矢量瓦片，带 3D 建筑和地形；MapLibre GL 使用 OpenFreeMap 矢量瓦片，不需要令牌。',
  'help.guide.map-provider.step.2':
    '为 Leaflet 选择“地图模板”，或为 GL 引擎选择“地图样式”，也可以粘贴你自己的 URL。Mapbox GL 需要“Mapbox 访问令牌”，CARTO 模板需要“CARTO API 密钥”；每个字段下方的链接会告诉你从哪里获取。',
  'help.guide.map-provider.step.3':
    '使用 Mapbox GL 时，打开“3D 建筑和地形”，如果设备性能足够，再打开“高画质模式”。查看预览后，点击“保存地图”。',
  'help.guide.map-provider.result': '行程规划和旅程日志的地图会使用你选的引擎，“足迹”始终使用 Leaflet。',
  'help.guide.map-provider.tip.1': '没有令牌时，Mapbox GL 会改用 Leaflet，而不是显示一张空白地图。',
  'help.guide.map-provider.tip.2': '你离线保存的地图瓦片，来自下载时正在使用的提供商。',
  // notification-channels
  'help.guide.notification-channels.title': '设置接收通知的方式',
  'help.guide.notification-channels.goal': '在手机或其他工具上接收旅行提醒和协作动态。',
  'help.guide.notification-channels.step.1':
    '对于 webhook，粘贴 Discord、Slack 或自定义的 Webhook URL，点击“测试”，然后点“保存”。',
  'help.guide.notification-channels.step.2':
    '对于 ntfy，填写“Ntfy 主题”；如果你自己运行了服务，还要填写你的“Ntfy 服务器 URL”和访问令牌。“测试”会立即发一条消息，“保存”则保存设置。',
  'help.guide.notification-channels.step.3':
    '在顶部的“通知”卡片中，按渠道开启或关闭每个事件。锁图标表示管理员已为所有人关闭它。插件渠道在配置好之前会显示“去配置”；“发送测试”可以试一下。',
  'help.guide.notification-channels.result':
    '事件会通过你为它们开启的渠道发送。“应用内通知”一列决定导航栏里的铃铛显示什么。',
  'help.guide.notification-channels.tip.1': '旅行自己的提醒（出发前多少天）在旅行的编辑表单中设置。',
  'help.guide.notification-channels.tip.2': '管理员可以为所有人预填一个默认的 ntfy 服务器，主题仍由你自己选择。',
  // photo-providers
  'help.guide.photo-providers.title': '连接照片库',
  'help.guide.photo-providers.goal': '让日志自动从 Immich 或 Synology Photos 加载当天的照片。',
  'help.guide.photo-providers.step.1':
    '在“集成”下，找到 Immich 或 Synology Photos 的卡片，填入它要求的内容：Immich 需要“服务器 URL”和“API 密钥”，Synology Photos 需要“用户名”和“密码”。Immich 还可以在你上传旅程照片时，把照片同步复制到 Immich 照片库。',
  'help.guide.photo-providers.step.2': '点击“测试连接”，然后点击“保存”。徽章会变为“已连接”。',
  'help.guide.photo-providers.result':
    '日志编辑器的“外部照片”标签页会在已连接的照片库中搜索该日志当天的照片，离日志位置最近的排在最前。',
  'help.guide.photo-providers.tip.1': '这个连接只属于你的账户：旅程的其他成员需要各自连接自己的照片库。',
  'help.guide.photo-providers.tip.2': '照片里没有 GPS 数据的服务商也可以使用，此时列表按时间排序。',
  // api-keys
  'help.guide.api-keys.title': '创建 API 密钥',
  'help.guide.api-keys.goal': '让其他软件通过公共 API 读取你的旅行。',
  'help.guide.api-keys.step.1':
    '在“API 密钥”下，点击“创建密钥”，起一个能说明用途的名称，并在“此密钥可读取的内容”下只保留它需要的范围。点击“创建”。',
  'help.guide.api-keys.step.2':
    '从“API 密钥已创建”中复制密钥：它只显示一次。点击“完成”。要调用的“端点”显示在列表下方。',
  'help.guide.api-keys.result':
    '拿到密钥的软件可以读取你选的范围，但绝不会修改任何内容。列表显示每个密钥的创建时间和最后使用时间，垃圾桶图标用来删除它。',
  'help.guide.api-keys.tip.1': '每个工具用一个密钥，这样撤销某个密钥时不会影响其他工具。',
  'help.guide.api-keys.tip.2': '想让 AI 客户端修改内容，请改用带 OAuth 的 MCP，API 密钥只能读取。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': '通过 MCP 连接 AI 助手',
  'help.guide.mcp-oauth.goal': '让 Claude、IDE 或其他 MCP 客户端访问你的旅行。',
  'help.guide.mcp-oauth.step.1': '在“MCP 配置”下，复制适用于你的客户端的“MCP 端点”。',
  'help.guide.mcp-oauth.step.2':
    '在“OAuth 2.1 客户端”下，点击“新建客户端”，选择一个快速预设，例如 Claude Desktop 或 Cursor，也可以自己填写“应用程序名称”“重定向 URI”和“允许的权限范围”。没有浏览器的服务器请选“机器客户端”。点击“注册客户端”，并复制“客户端密钥”，它只显示一次。',
  'help.guide.mcp-oauth.step.3':
    '每个客户端都有“轮换密钥”和“删除客户端”。“活跃的 OAuth 会话”列出已登录的客户端，并带有“撤销”。“客户端配置”可展开，显示适用于 JSON 客户端的现成代码片段。',
  'help.guide.mcp-oauth.result': '客户端可以以你的身份读取和修改其权限范围允许的内容，每一步操作都会记在你的名下。',
  'help.guide.mcp-oauth.tip.1': '权限范围用来限制客户端能做什么：在客户端需要更多权限之前，只给它读取权限。',
  'help.guide.mcp-oauth.tip.2': '管理员可以为整个实例关闭 MCP，关闭后这一部分不会显示。',
  // offline-prepare
  'help.guide.offline-prepare.title': '把旅行保存到离线使用',
  'help.guide.offline-prepare.goal': '在断网之前，先把你的旅行及其地图保存到这台设备上。',
  'help.guide.offline-prepare.step.1':
    '在“要离线存储的内容”下，保持“离线存储地图瓦片”开启，并打开你想存到这台设备上的旅行。已结束的旅行只有在你打开开关后才会存储。',
  'help.guide.offline-prepare.step.2':
    '回到顶部，在“为离线做准备”下，点击“下载以供离线使用”。它会获取旅行数据、文档和地图瓦片，并说明保存了多少个旅行。',
  'help.guide.offline-prepare.step.3':
    '“强制离线模式”会再下载一次，然后只在这台设备上工作，这样你出发前就能检查一切是否齐全。',
  'help.guide.offline-prepare.result': '旅行在没有网络时也能打开。你所做的更改会先存入队列，重新联网后自动发送。',
  'help.guide.offline-prepare.tip.1': '地图瓦片占用空间最多，关闭后可以只保留旅行数据和文档。',
  'help.guide.offline-prepare.tip.2': '在浏览器中把 TREK 安装为应用，离线启动最顺畅。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '同步冲突时决定保留哪个版本',
  'help.guide.offline-conflicts.goal': '选择离线修改与别处修改发生冲突时，TREK 如何解决。',
  'help.guide.offline-conflicts.step.1':
    '如果你离线时做的更改与较新的更改冲突，“离线”页面靠近顶部的位置会出现“同步冲突”。对每处更改，点击“用我的”或“保留对方的”。',
  'help.guide.offline-conflicts.step.2':
    '在同一张卡片中，“发生冲突时”决定以后怎么处理：“每次询问我”“始终保留我的版本”或“始终保留服务器版本”。',
  'help.guide.offline-conflicts.result':
    '选择“每次询问我”时，冲突会留在“同步冲突”中，等你决定；选择另外两项时，TREK 会自动解决冲突。',
  'help.guide.offline-conflicts.tip.1': '“清除缓存”只会删除这台设备上的副本，服务器上的内容不受影响。',
  // profile
  'help.guide.profile.title': '修改个人资料',
  'help.guide.profile.goal': '更新你的姓名、邮箱和头像。',
  'help.guide.profile.step.1':
    '在“账户”卡片中，点击头像上的相机图标上传图片；红色垃圾桶可以再次移除，并恢复显示你名字的首字母。',
  'help.guide.profile.step.2': '在头像下方编辑“用户名”和“邮箱”。',
  'help.guide.profile.result': '你的名字和头像会同时在各处更新，包括你参与的共享旅行。',
  'help.guide.profile.tip.1': '通过 SSO 关联的账号会显示 SSO 徽章和“已关联”的服务商。',
  // password
  'help.guide.password.title': '修改密码',
  'help.guide.password.goal': '设置新密码。',
  'help.guide.password.step.1':
    '在“修改密码”下，输入“当前密码”，然后输入“新密码”，并在“确认新密码”中再输入一次。输入时，下方列表会逐条标出已满足的规则。',
  'help.guide.password.step.2': '点击“更新密码”。',
  'help.guide.password.result':
    '新密码立即生效。其他所有设备都会退出登录，你的 MCP API 令牌会被删除，OAuth 客户端需要重新登录，当前设备保持登录。',
  'help.guide.password.tip.1': '如果这个 TREK 只能通过 SSO 登录，就没有 TREK 密码，也没有“修改密码”卡片。',
  // mfa
  'help.guide.mfa.title': '开启双因素认证',
  'help.guide.mfa.goal': '用身份验证器应用生成的验证码保护你的账户。',
  'help.guide.mfa.step.1': '在“双因素认证 (2FA)”下，点击“设置身份验证器”。',
  'help.guide.mfa.step.2':
    '用你的验证器应用扫描二维码，或手动输入密钥，然后输入应用显示的六位验证码，再点击“启用 2FA”。',
  'help.guide.mfa.step.3':
    '用“复制代码”“下载 TXT”或“打印 / PDF”保存备份代码，然后点击“确定”。每个代码只能用一次。手边没有手机时，就用一个备份代码。',
  'help.guide.mfa.result': '之后每次登录，输入密码后都会要求输入验证码。',
  'help.guide.mfa.tip.1': '“停用 2FA”需要你的密码，以及当前验证码或一个未使用的备份代码。',
  'help.guide.mfa.tip.2': '管理员可以要求所有人使用 2FA，这时无法在这里关闭。',
  // passkeys
  'help.guide.passkeys.title': '使用通行密钥登录',
  'help.guide.passkeys.goal': '用设备的指纹、面容或 PIN 码代替密码登录。',
  'help.guide.passkeys.step.1':
    '在“通行密钥”下，点击“添加通行密钥”，确认你当前的密码，给它起一个能说明是哪台设备的名字，然后按设备的提示操作。',
  'help.guide.passkeys.step.2':
    '每个通行密钥都会显示是“已同步”还是绑定在“本设备”，以及上次使用时间。“重命名”可修改名称，删除按钮在你输入密码后将其移除。',
  'help.guide.passkeys.result': '登录页面会提供通行密钥登录，你仍然可以用密码登录。',
  'help.guide.passkeys.tip.1': '通行密钥保存在设备或设备的密码管理器里，所以每台设备都要添加一个。',
  'help.guide.passkeys.tip.2':
    '管理员开启后才会显示通行密钥。服务器还没有配置 WebAuthn 域名时，卡片会直接说明，而不是提供“添加通行密钥”。',
  // delete-account
  'help.guide.delete-account.title': '删除你的账号',
  'help.guide.delete-account.goal': '删除你的账号和只属于你的数据。',
  'help.guide.delete-account.step.1': '在“账户”卡片中，点击页脚左侧的“删除账户”，然后点击“永久删除”。',
  'help.guide.delete-account.result':
    '你的账户会被删除，你名下的旅行、地点和文件也会一并删除。其他人拥有的旅行仍会保留。',
  'help.guide.delete-account.tip.1': '如果你是唯一的管理员，TREK 会提示“无法删除”：请先把另一位用户提升为管理员。',
  'help.guide.delete-account.tip.2': '删除后无法恢复。确认之前，请先导出你想保留的内容。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理员',
  'help.ctx.admin.summary':
    '整个 TREK 实例对所有用户生效的设置：谁可以登录、如何登录，启用了什么，文件存放在哪里，服务器如何联系用户，以及如何备份。只有管理员能看到这个页面。侧边栏把标签页分在“用户”“配置”“集成”和“维护”下，每个标签页是独立的一屏。',
  'help.ctx.admin.bullet.1':
    '标题右侧统计用户、旅行、地点和文件的数量。其下方，当有更新的 TREK 版本发布时，会出现“有可用更新”横幅。',
  'help.ctx.admin.bullet.2': '“用户”和“用户默认设置”：账户、邀请链接和权限，以及新账户初始使用的设置和地图。',
  'help.ctx.admin.bullet.3':
    '个性化、设置、扩展、插件和存储：行李模板、分类和学校假期；登录、通行密钥、2FA、API 密钥和搜索源；功能模块；第三方插件；上传文件的存放位置。',
  'help.ctx.admin.bullet.4':
    '通知、MCP 访问和 GitHub：用户可选的渠道及初始默认值、AI 客户端的令牌和会话，以及版本历史。',
  'help.ctx.admin.bullet.5': '“备份”和“审计”：手动和定时备份，以及安全相关事件的日志。',
  'help.ctx.admin-users.title': '用户',
  'help.ctx.admin-users.summary':
    '此 TREK 上的所有账户，显示角色、邮箱和最后活跃时间，还有让人们在封闭实例上注册的邀请链接，以及谁能在旅行中做什么。',
  'help.ctx.admin-users.bullet.1':
    '表格：用户、邮箱、角色、创建时间和“最后活动”，每行带有“编辑用户”和“删除用户”。头像上的绿点表示此人当前在线，你自己的那一行标有“（你）”。',
  'help.ctx.admin-users.bullet.2': '“用户”卡片右上角的“创建用户”可以手动添加账户，密码由你告诉对方。',
  'help.ctx.admin-users.bullet.3':
    '下方的“邀请链接”：带使用次数上限和有效期的注册链接，还可以指定新用户注册后加入的旅行。',
  'help.ctx.admin-users.bullet.4':
    '底部的“权限设置”：针对每个操作，设置谁可以执行（“所有人”“旅行成员”“旅行所有者”或“仅管理员”）。点击卡片顶部的“保存”来保存。',
  'help.ctx.admin-defaults.title': '用户默认设置',
  'help.ctx.admin-defaults.summary':
    '新账户的初始设置，这样没有人需要先去设置：颜色模式、单位、时间格式、每周起始日、显示货币和隐藏的预订码，以及地图、它的密钥和路径规划服务器。',
  'help.ctx.admin-defaults.bullet.1':
    '左侧的“用户默认设置”：颜色模式、温度单位、距离单位、时间格式、每周开始于、显示货币和隐藏预订编号。',
  'help.ctx.admin-defaults.bullet.2':
    '右侧的地图：“地图模板”、“共享 CARTO 密钥”、“自建路径规划服务”和“自建 Valhalla 实例”、预览，然后是“地图引擎”，其下有“地图样式”“共享 Mapbox 令牌”“3D 建筑与地形”和“高质量模式”。',
  'help.ctx.admin-config.title': '个性化',
  'help.ctx.admin-config.summary':
    '实例上所有旅行共用的设置：行李模板、地点和收藏所用的分类集合，以及“假期”使用的学校假期目录。',
  'help.ctx.admin-config.bullet.1': '“打包模板”：有名称的分类和物品清单，旅行的行李清单可以以它为起点。',
  'help.ctx.admin-config.bullet.2':
    '分类：TREK 中各处使用的分类的名称、图标和颜色，从地点检查器到“收藏”都会用到，每个分类都在带预览的对话框中编辑。',
  'help.ctx.admin-config.bullet.3': '“学校假期”：国家和地区及其假期时段的目录，所有人都可以在“假期”中选用。',
  'help.ctx.admin-settings.title': '设置',
  'help.ctx.admin-settings.summary':
    '用户如何登录，以及服务器可以使用哪些外部服务。左侧：“登录方式”“通行密钥登录”“要求双因素身份验证（2FA）”和“单点登录 (OIDC)”。右侧：“允许的文件类型”，以及带有搜索和交通提供商的“API 密钥”。“危险区域”在底部。',
  'help.ctx.admin-settings.bullet.1':
    '“登录方式”：“密码登录”“密码注册”，以及设置好 OIDC 之后的“SSO 登录”和“SSO 自动创建账户”。“要求双因素身份验证（2FA）”有单独的卡片。',
  'help.ctx.admin-settings.bullet.2':
    '“通行密钥登录”：“启用通行密钥登录”、“Relying Party ID（域名）”和“允许的来源”。“单点登录 (OIDC)”：“显示名称”、“颁发者 URL”、可选的“Discovery URL（可选）”、“客户端 ID”和“客户端密钥”。',
  'help.ctx.admin-settings.bullet.3':
    'API 密钥：TREK Places API 排在最前，不需要密钥。其下是 Google Maps API 密钥（带“测试”和“该密钥的用途”）、Unsplash 密钥和高德地图密钥，卡片底部有一个“保存”。',
  'help.ctx.admin-settings.bullet.4':
    '“公共交通数据源”和“地点搜索源”决定由谁来处理公共交通和地点搜索，“地点搜索记录”记录最终选中了哪个结果，“允许的文件类型”用来限制上传。',
  'help.ctx.admin-addons.title': '扩展',
  'help.ctx.admin-addons.summary':
    'TREK 的功能模块，每个模块都有一个开关：行李、预算、文档、假期、足迹、协作、旅程、收藏、公路旅行、MCP、AirTrail、Dawarich 和 AI 解析。关闭后，导航入口、路由和 API 对所有人都会被移除。',
  'help.ctx.admin-addons.bullet.1': '每个扩展一张卡片，带有开关；有选项的扩展还会有对应的子行。',
  'help.ctx.admin-addons.bullet.2':
    '照片服务和文档服务也以卡片形式显示在这里，这样就能把 Immich 或 Synology 提供给用户。',
  'help.ctx.admin-addons.bullet.3': '“行李追踪”在卡片下方有自己的开关。',
  'help.ctx.admin-plugins.title': '插件',
  'help.ctx.admin-plugins.summary':
    '第三方插件，在 TREK 旁边以独立进程运行，每个插件只拥有安装时申请的权限。你可以从目录安装、上传安装包，或者在开发插件时关联一个文件夹。',
  'help.ctx.admin-plugins.bullet.1':
    '“已安装”和“发现”，带有“搜索插件…”以及“类型”“状态”和“排序”筛选。每行显示版本、“已审核”、“已签名”或“未签名”、插件可访问的内容、一个开关和一个 ⋯ 菜单。',
  'help.ctx.admin-plugins.bullet.2':
    '卡片标题处的两个图标：“上传插件”接受 .zip、.tgz 或 .tar.gz（也可以把 .zip 拖到页面上）；“重新扫描”会找到为开发而链接的插件文件夹。',
  'help.ctx.admin-plugins.bullet.3': '每个插件的“允许的主机”：插件可以访问的地址，因为对外连接默认是被禁止的。',
  'help.ctx.admin-storage.title': '存储',
  'help.ctx.admin-storage.summary':
    '上传文件存放的位置：本地磁盘或 S3 存储桶，还可以再复制到其他后端。每个上传类别可以用不同的后端，点击“保存更改”之前不会有任何变化。',
  'help.ctx.admin-storage.bullet.1': '顶部的“健康”：写入镜像目标失败的记录，或“未记录任何副本故障。”',
  'help.ctx.admin-storage.bullet.2':
    '“后端”：名称、类型、用量和“镜像到”，带有“测试”“编辑”和“移除”。“立即计算”会统计已存储的内容；由环境变量定义的后端是只读的。',
  'help.ctx.admin-storage.bullet.3':
    '分类：行程文档、旅程照片、封面、头像、地点图片、照片缓存和备份，每一项都分配给一个后端。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    '这里是实例向用户提供的通知渠道，以及你作为管理员接收通知的渠道。用户在“设置”里选择自己的主题和 URL；你决定提供哪些渠道，并配置邮件。',
  'help.ctx.admin-notifications.bullet.1':
    '“电子邮件 (SMTP)”、Webhook、Ntfy 和“Web 推送”各有一个开关，决定是否向用户提供该渠道，电子邮件还需要填写服务器设置。“应用内通知”始终开启。',
  'help.ctx.admin-notifications.bullet.2': '“行程提醒”：服务器是否在旅行开始前发送提醒。',
  'help.ctx.admin-notifications.bullet.3':
    '“管理员 Webhook”“管理员 Ntfy”和“通知”卡片：决定管理员事件（“有新版本可用”“存储副本故障”“划桨区域申请”）发送到哪里，每项各有一个测试按钮。',
  'help.ctx.admin-mcp-tokens.title': 'MCP 访问',
  'help.ctx.admin-mcp-tokens.summary':
    'AI 客户端在这个 TREK 上持有的所有令牌和 OAuth 会话，涵盖所有用户。你可以撤销其中任何一个。',
  'help.ctx.admin-mcp-tokens.bullet.1': '“OAuth 会话”：客户端、获得的权限范围、所有者和日期，垃圾桶图标可撤销该会话。',
  'help.ctx.admin-mcp-tokens.bullet.2': '“API 令牌”：名称、所有者、“创建时间”和“最后使用”，垃圾桶图标可删除它。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK 的新动态：来自 GitHub 的发布历史，以及是否有比你当前版本更新的版本。更新本身在应用之外，由主机来完成。',
  'help.ctx.admin-github.bullet.1':
    '“版本历史”以时间线列出各个版本及其说明。最新的版本带有“最新”标记，预发布版本显示“预发布”，GitHub 按钮会打开发布页面。',
  'help.ctx.admin-github.bullet.2':
    '有新版本发布后，页面标题下方会出现“有可用更新”。“如何更新”会显示 Docker 的命令，其他安装方式则显示更新指南。',
  'help.ctx.admin-backup.title': '备份',
  'help.ctx.admin-backup.summary':
    '数据库和上传文件的完整备份，可手动创建，也可按计划自动创建，保存在服务器上，并可作为单个文件下载。用“恢复”还原备份。',
  'help.ctx.admin-backup.bullet.1':
    '“数据备份”：卡片顶部有“创建备份”和“上传备份”，下面是备份列表，每项带有“下载”“恢复”和用于删除的垃圾桶图标。',
  'help.ctx.admin-backup.bullet.2': '“上传备份”可用在另一个实例上或更早生成的文件来恢复，确认提示与“恢复”相同。',
  'help.ctx.admin-backup.bullet.3':
    '“自动备份”：开启或关闭、“间隔”、“执行时间”和星期几，以及“自动删除旧备份”（1 天到“永久保留”），点击“保存”后生效。',
  'help.ctx.admin-audit.title': '审计',
  'help.ctx.admin-audit.summary':
    '安全相关和管理类事件的日志：登录及失败、MFA 变更、用户和设置变更、备份和恢复。只读，最新的排在最前。',
  'help.ctx.admin-audit.bullet.1': '每个事件一行，包含时间、用户、操作、资源、IP 和详情。',
  'help.ctx.admin-audit.bullet.2':
    '卡片标题中的“刷新”用于重新加载列表。标题旁的徽章显示已加载的条数和总数，“加载更多”会加载更早的条目。',
  // create-user
  'help.guide.create-user.title': '创建用户',
  'help.guide.create-user.goal': '不通过邀请，直接手动添加一个账户。',
  'help.guide.create-user.step.1': '点击“用户”卡片右上角的“创建用户”。',
  'help.guide.create-user.step.2':
    '输入“用户名”“邮箱”和“密码”；密码下方的清单会逐条勾选密码满足了哪些规则。选择“角色”：用户或管理员。',
  'help.guide.create-user.step.3': '点击“创建用户”。',
  'help.guide.create-user.result': '账号会出现在表格中，并且可以立即登录。请通过你信任的渠道把密码告诉对方。',
  'help.guide.create-user.tip.1': '如果希望对方自己设置密码，用邀请链接更合适。',
  'help.guide.create-user.tip.2':
    '管理员能看到此页面，并可执行所有操作。用户在旅行中能做什么，请在下方的“权限设置”中设置。',
  // edit-user
  'help.guide.edit-user.title': '修改用户资料或密码',
  'help.guide.edit-user.goal': '给某人改名、升级或降级其权限，或在对方忘记密码后帮他重新登录。',
  'help.guide.edit-user.step.1': '点击用户所在行的铅笔图标（“编辑用户”）。对话框顶部显示该账户的邮箱。',
  'help.guide.edit-user.step.2':
    '修改“用户名”、“邮箱”或“角色”，或输入“新密码”（留空则保留当前密码），然后点击“保存”。底部的“重置通行密钥”在你确认后会移除该账户的所有通行密钥。',
  'help.guide.edit-user.result': '修改会立即生效。设置新密码还会让这位用户在所有设备上退出登录，旧会话随即失效。',
  'help.guide.edit-user.tip.1': '只要你还是最后一位管理员，就不能取消自己的管理员角色。',
  'help.guide.edit-user.tip.2': '重置通行密钥不会影响密码；对方可以在“设置”的“账户”里添加新的通行密钥。',
  // invite-links
  'help.guide.invite-links.title': '通过链接邀请他人',
  'help.guide.invite-links.goal': '让某人在封闭的实例上自行注册，还可以顺便把他们加入某个旅行。',
  'help.guide.invite-links.step.1': '点击“邀请链接”卡片右上角的“创建链接”。',
  'help.guide.invite-links.step.2':
    '选择“最大使用次数”（1× 到 5×，或 ∞）和“有效期”（1 天到 14 天，或 ∞），也可以在“添加到行程（可选）”下选择一个旅行，然后点击“创建并复制”。',
  'help.guide.invite-links.step.3':
    '把链接发出去。每一行会显示已使用次数、过期时间、会加入的旅行和创建者，旁边标有“有效”“已过期”或“已用完”。“复制链接”可再次复制，垃圾桶用来删除。',
  'help.guide.invite-links.result': '打开链接的人用自己设置的密码注册。如果选择了旅行，他们会直接加入该旅行。',
  'help.guide.invite-links.tip.1': '即使在“设置”里关闭了“密码注册”，邀请链接依然有效。',
  'help.guide.invite-links.tip.2': '给单个人发链接时，最安全的默认做法是只能用一次、有效期很短。',
  // delete-user
  'help.guide.delete-user.title': '删除用户',
  'help.guide.delete-user.goal': '删除一个账号及其名下的所有内容。',
  'help.guide.delete-user.step.1': '点击用户所在行的垃圾桶（“删除用户”），然后点击“删除”确认。',
  'help.guide.delete-user.result':
    '该账户会被删除，它名下的所有旅行和旅程也会一并删除，即使是与他人共享的旅行。它只是成员的旅行仍留在各自所有者那里。',
  'help.guide.delete-user.tip.1': '删除后无法恢复。如果拿不准，请先做一份备份。',
  'help.guide.delete-user.tip.2': '你自己那一行的垃圾桶图标不起作用：你不能删除自己，必须由另一位管理员来删。',
  // permissions
  'help.guide.permissions.title': '设置谁可以做什么',
  'help.guide.permissions.goal': '按具体操作设置，在这个 TREK 上允许哪个角色执行。',
  'help.guide.permissions.step.1':
    '在“权限设置”下，找到所在分组里的操作，例如“旅行管理”下的“删除行程”，然后选择谁可以执行：“所有人”“旅行成员”“旅行所有者”或“仅管理员”。修改过的行会标为“已自定义”。',
  'help.guide.permissions.step.2': '点击卡片右上角的“保存”。“恢复默认”会把每一行恢复为内置级别，之后同样要点击“保存”。',
  'help.guide.permissions.result': '这条规则对所有旅行同时生效。级别低于要求的人将看不到相关的按钮和菜单。',
  'help.guide.permissions.tip.1': '“旅行所有者”指创建该旅行的人；管理员始终可以执行所有操作。',
  'help.guide.permissions.tip.2': '每个操作各占一行，所以你可以，比如，让成员规划地点和日期，但把删除旅行留给所有者。',
  // default-map
  'help.guide.default-map.title': '为新用户设置地图默认值',
  'help.guide.default-map.goal': '让每个新账号无需个人令牌也能用上地图。',
  'help.guide.default-map.step.1':
    '在“地图”下，选择“地图模板”或粘贴瓦片 URL；如果使用 CARTO 瓦片，还要输入“共享 CARTO 密钥”。下方的预览会显示效果。',
  'help.guide.default-map.step.2':
    '再往下，选择“地图引擎”：标准（免费）、Mapbox（3D）或 MapLibre (OpenFreeMap)。选 Mapbox 和 MapLibre 时要选“地图样式”；选 Mapbox 时还要填写“共享 Mapbox 令牌”，并决定是否启用“3D 建筑与地形”和“高质量模式”。',
  'help.guide.default-map.result': '新账号会从这些设置开始；已在“设置”里设置了自己地图的用户保留自己的设置。',
  'help.guide.default-map.tip.1': '在这里填写的令牌或密钥，会被所有没有自己令牌或密钥的用户共用，所以请留意它的配额。',
  'help.guide.default-map.tip.2': '从未改动过地图标签页的现有账户，也会使用这些默认设置。',
  // packing-templates
  'help.guide.packing-templates.title': '创建行李模板',
  'help.guide.packing-templates.goal': '让旅行从一份现成的行李清单开始，而不是从空白开始。',
  'help.guide.packing-templates.step.1': '点击“新建模板”，输入名称，再点对勾确认。',
  'help.guide.packing-templates.step.2':
    '点击模板名称将其打开，然后点击“添加分类”。分类标题中的 + 用来添加物品，物品只需要一个名称。',
  'help.guide.packing-templates.step.3':
    '所有内容都会随操作自动保存。铅笔用来重命名模板、分类或物品。垃圾桶会立即删除物品，而删除模板或分类前会先询问，因为其中的所有内容也会一并删除。',
  'help.guide.packing-templates.result':
    '每次旅行的行李清单里都会提供这个模板。套用模板时会复制其中的物品，所以每次旅行都可以随意修改。',
  'help.guide.packing-templates.tip.1': '为每种旅行类型（海滩、城市、徒步）各建一个模板，比一份超长的清单更好用。',
  'help.guide.packing-templates.tip.2': '删除模板不会影响已经应用过它的旅行。',
  'help.guide.packing-templates.tip.3':
    '旅行行李清单上的“保存为模板”会生成一个模板，包含每件物品的重量、数量和所在的包。它们会显示在这里物品的旁边，应用模板时物品会放进相同的包里。',
  // categories
  'help.guide.categories.title': '管理分类',
  'help.guide.categories.goal': '决定地点和收藏可以使用哪些分类，以及这些分类的样式。',
  'help.guide.categories.step.1':
    '点击“新分类”，在对话框的标题行输入名称，选择“图标”和“颜色”，并查看“预览”。点击“创建”。',
  'help.guide.categories.step.2':
    '在列表中，铅笔图标（“编辑”）打开一个分类，“更新”保存修改。垃圾桶图标（“删除”）在你确认后移除该分类。',
  'help.guide.categories.result': '这组分类会同时应用到所有位置：地点详情、地图图钉、收藏和筛选器。',
  'help.guide.categories.tip.1': '地点保存的是分类 ID，所以重命名分类后，所有地点上的分类名都会随之更新。',
  'help.guide.categories.tip.2': '删除分类后，属于它的地点就没有分类了。如果这很重要，请先把这些地点改到别的分类。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '手动维护学校假期',
  'help.guide.school-holiday-catalog.goal': '维护某个国家或地区的学校假期，供所有人在“假期”中选用。',
  'help.guide.school-holiday-catalog.step.1':
    '在“学校假期”下，选择国家，或点击 +（添加国家），输入国家及其“国家代码（如 US）”后保存。“添加地区”用来添加该国家中有各自日期的每个地区。',
  'help.guide.school-holiday-catalog.step.2':
    '点击一个地区，打开“地区或学区”：点击“添加假期”，为每个假期填写“假期名称”“开始日期”和“结束日期”，然后保存。垃圾桶可删除一个假期或一个地区，国家要在没有地区后才能删除。',
  'help.guide.school-holiday-catalog.result':
    '用户可以在“假期”的“设置”里找到对应的国家和地区，并在年度网格上看到这些假期。',
  'help.guide.school-holiday-catalog.tip.1': '已被某人选入其假期日历的地区无法删除。',
  // auth-methods
  'help.guide.auth-methods.title': '设置登录方式',
  'help.guide.auth-methods.goal': '开启或关闭密码登录、SSO 和注册，并可以要求使用 2FA。',
  'help.guide.auth-methods.step.1':
    '在“登录方式”下，开启或关闭“密码登录”和“密码注册”，每个开关立即生效。关闭注册后，新账户只能通过邀请链接、SSO 或“创建用户”产生。',
  'help.guide.auth-methods.step.2':
    '“SSO 登录”和“SSO 自动创建账户”需要先在下方配置好“单点登录 (OIDC)”。自动创建账户会在某人首次通过 SSO 登录时为其创建账户。',
  'help.guide.auth-methods.step.3':
    '打开“要求双因素身份验证（2FA）”后，所有没设置 2FA 的人必须先在“设置”中完成设置，才能使用 TREK。',
  'help.guide.auth-methods.result': '登录页面只会提供你保持开启的登录方式。',
  'help.guide.auth-methods.tip.1':
    'TREK 不允许你关掉最后一种登录方式：它的开关会变灰，提示显示“至少要保留一种登录方式”。',
  'help.guide.auth-methods.tip.2': '如果服务器上设置了 OIDC_ONLY，密码开关会被锁定，并有提示说明。',
  // oidc
  'help.guide.oidc.title': '接入单点登录',
  'help.guide.oidc.goal': '让用户通过你的身份提供商登录。',
  'help.guide.oidc.step.1':
    '在“单点登录 (OIDC)”下，输入按钮的“显示名称”、“颁发者 URL”，以及你的提供商给出的“客户端 ID”和“客户端密钥”。只有当提供商没有在常规地址发布时（例如 Authentik），才需要填写“Discovery URL（可选）”。点击“保存”。',
  'help.guide.oidc.step.2': '在“登录方式”下开启“SSO 登录”。',
  'help.guide.oidc.result': '登录页面会显示 SSO 按钮；开启“SSO 自动创建账户”后，首次登录的用户会自动获得账户。',
  'help.guide.oidc.tip.1': '服务商需要的重定向 URI，是你的 TREK 地址加上文档中给出的 OIDC 回调路径。',
  'help.guide.oidc.tip.2': '声明映射决定哪些 SSO 群组会成为管理员，详见文档中的 OIDC 页面。',
  // instance-keys
  'help.guide.instance-keys.title': '填写 API 密钥',
  'help.guide.instance-keys.goal': '为整个实例启用 Google 照片和评分、Unsplash 封面以及高德地图搜索。',
  'help.guide.instance-keys.step.1':
    '在“API 密钥”下，顶部的 TREK Places API 无需密钥就能处理地点搜索。点击“里面有什么”可查看它涵盖和不涵盖的内容。',
  'help.guide.instance-keys.step.2':
    '要使用照片、评分和营业时间，粘贴 Google Maps API 密钥并点击“测试”，会显示“已连接”或“无效”。打开“该密钥的用途”，只开启你愿意计费的项目：“地点照片”“地点自动补全”“地点详情”“地点信息补充”和“仅使用 Google 搜索”，另外还可以设置“Google 调用每日上限”。',
  'help.guide.instance-keys.step.3':
    '粘贴用于封面搜索的“Unsplash API 密钥”，以及用于中国大陆地点搜索的“高德地图 API Key”，然后点击卡片底部的“保存”。',
  'help.guide.instance-keys.result':
    '用户不用自己配置密钥就能使用这些功能。没有 Google 密钥时，搜索会使用 TREK Places API 和 OpenStreetMap。',
  'help.guide.instance-keys.tip.1': '如果用户在“设置”里有自己的密钥，TREK 对该用户会优先使用个人密钥，而不是实例密钥。',
  'help.guide.instance-keys.tip.2': '密钥也可以来自环境变量，这类密钥在这里显示为只读。',
  'help.guide.instance-keys.tip.3':
    '“Google 调用每日上限”限制 TREK 每天最多能在这个密钥上使用多少，标题旁的徽章统计今天已经调用了多少次。达到上限后，搜索会改用 OpenStreetMap，直到第二天（UTC）。',
  // places-transit
  'help.guide.places-transit.title': '选择搜索和公共交通服务商',
  'help.guide.places-transit.goal': '选择由哪个服务来处理地点搜索和公共交通路线请求。',
  'help.guide.places-transit.step.1':
    '在“公共交通数据源”下选择：“Transitous（免费）”，无需密钥，在欧洲覆盖最好；或选择 Google，它使用 Google 密钥。选择会立即保存。',
  'help.guide.places-transit.step.2':
    '在“地点搜索源”下，选择当 TREK 索引和 OpenStreetMap 都找不到时去问哪个服务：“自动”（有密钥时用 Google，然后用高德地图）、Google Places、高德地图或 OpenStreetMap。',
  'help.guide.places-transit.result': 'TREK 中的所有搜索框和所有公共交通路线都会使用这个选择。',
  'help.guide.places-transit.tip.1':
    '缺少密钥的选项会在此显示警告。此时地点搜索只使用 TREK 索引和 OpenStreetMap，公共交通只使用 Transitous。',
  'help.guide.places-transit.tip.2': 'Google 公共交通路线按请求计费，Transitous 不收费。',
  // file-types
  'help.guide.file-types.title': '限制文件类型',
  'help.guide.file-types.goal': '决定上传的文件允许使用哪些扩展名。',
  'help.guide.file-types.step.1':
    '在“允许的文件类型”下，编辑以逗号分隔的扩展名列表，或输入 * 允许所有类型，然后点击“保存”。',
  'help.guide.file-types.result': '其他类型的上传会被拒绝并给出明确提示，文档、旅程日志和封面都是如此。',
  'help.guide.file-types.tip.1': '请保留列表中的图片类型：封面和旅程照片也按同一份列表检查。',
  // toggle-addon
  'help.guide.toggle-addon.title': '开启或关闭扩展',
  'help.guide.toggle-addon.goal': '让所有人都能使用某个功能模块，或者将其移除。',
  'help.guide.toggle-addon.step.1': '点击扩展卡片上的开关。对应的导航项会立即对所有人显示或隐藏。',
  'help.guide.toggle-addon.step.2':
    '有些卡片带有选项子行，比如“列表”下的“行李追踪”，或“旅程”下的照片服务。这些子行只在扩展开启时显示。',
  'help.guide.toggle-addon.result': '关闭扩展时，它的数据会保留；重新开启后，数据会再次出现。',
  'help.guide.toggle-addon.tip.1': '关闭 MCP 会同时移除它的端点以及依赖它的“集成”部分。',
  'help.guide.toggle-addon.tip.2': 'Vacay、Atlas 和旅程是用户最常要求开启的扩展；文档需要有存储空间来保存上传的文件。',
  // install-plugin
  'help.guide.install-plugin.title': '安装插件',
  'help.guide.install-plugin.goal': '添加第三方插件，并且只授予它所申请的权限。',
  'help.guide.install-plugin.step.1':
    '打开“发现”，用“搜索插件…”或“类型”筛选找到插件，点击“安装”。如果有安装包文件，点击“上传插件”（卡片右上角的云图标），或直接把 .zip 拖到页面上。',
  'help.guide.install-plugin.step.2':
    '在“已安装”下，查看插件所在的行：插件可以访问什么、连接哪些主机，以及它是否“已审核”和“已签名”。然后打开“启用插件”，该行会显示“有效”。',
  'help.guide.install-plugin.step.3':
    '该行的 ⋯ 菜单提供“重启”“查看错误日志”“允许的主机”和“更换版本…”，以及源码链接，“删除”会卸载插件并清除其数据。有新版本时，该行会显示为可更新，需要新权限的版本在你批准之前保持关闭。',
  'help.guide.install-plugin.result':
    '插件在自己的进程中运行。它添加的内容，比如小组件、地图图层或工具，会出现在插件指定的位置。',
  'help.guide.install-plugin.tip.1': '“重新扫描”可以找到为开发而链接、没有打包的插件文件夹。',
  'help.guide.install-plugin.tip.2': '未签名的插件会有相应标记，只有在你信任其来源时才安装。',
  // storage-backends
  'help.guide.storage-backends.title': '把上传文件迁移到 S3 或做镜像',
  'help.guide.storage-backends.goal': '把文件存放在对象存储上，或把每个上传文件复制到第二个后端。',
  'help.guide.storage-backends.step.1':
    '在“后端”下，点击“添加后端”，起一个“名称”，选择“类型”（“本地”或 S3），并填写其字段。如果想在别处保留一份副本，勾选“镜像目标”。点击“应用”，然后在新增的行上点击“测试”检查连接。',
  'help.guide.storage-backends.step.2':
    '在“分类”下，把每一类上传内容，例如“行程文档”“旅程照片”或“备份”，分配给一个后端。',
  'help.guide.storage-backends.step.3':
    '点击底部的“保存更改”。如果某个分类现在指向了别处，TREK 会询问是“移动现有对象”还是“仅路由新写入”。',
  'help.guide.storage-backends.result':
    '新上传的文件会进入分配的后端。已移动的文件从新后端读取，你选择不移动的文件则留在原处。',
  'help.guide.storage-backends.tip.1': '通过环境变量配置的存储后端会显示出来，但不能在这里编辑。',
  'help.guide.storage-backends.tip.2':
    '镜像目标会获得每次新写入内容的副本，该行上的“立即同步”则复制此前已存储的内容。速度慢的目标会拖慢该后端上的每次上传。',
  // channels-instance
  'help.guide.channels-instance.title': '配置通知渠道',
  'help.guide.channels-instance.goal': '决定用户可以选择哪些通知渠道，并设置电子邮件。',
  'help.guide.channels-instance.step.1':
    '在卡片标题中打开“电子邮件 (SMTP)”，输入 SMTP Host、SMTP Port、SMTP User、SMTP Password 和发件地址，然后点击“保存”。“发送测试邮件”会给你发一封邮件。“跳过 TLS 证书检查”仅适用于使用自有证书的本地邮件服务器。',
  'help.guide.channels-instance.step.2':
    '打开“Webhook”“Ntfy”和“Web 推送”，即可向用户提供这些渠道。用户随后在“设置”的“通知”中输入自己的 URL 或主题，或按设备开启推送。',
  'help.guide.channels-instance.step.3': '“行程提醒”控制旅行开始前的提醒；“应用内通知”始终开启。',
  'help.guide.channels-instance.result': '每位用户的“通知”标签页都会显示你开启的渠道。',
  'help.guide.channels-instance.tip.1':
    '“管理员 Ntfy”卡片中的“Ntfy 服务器 URL”也是用户的默认服务器，用户仍可填写自己的服务器。',
  'help.guide.channels-instance.tip.2': '只要有具备相应功能的插件处于启用状态，插件渠道就会自动出现。',
  // admin-channels
  'help.guide.admin-channels.title': '在手机上接收管理员事件',
  'help.guide.admin-channels.goal': '及时收到新版本、存储镜像失败和划桨区域申请的通知。',
  'help.guide.admin-channels.step.1':
    '在“管理员 Ntfy”下，填写“管理员主题”，需要时再填“Ntfy 服务器 URL”和“访问令牌（可选）”。在“管理员 Webhook”下，填写一个 URL。在每张卡片中点击“保存”。',
  'help.guide.admin-channels.step.2': '点击“发送测试 Ntfy”或“发送测试 Webhook”，看消息是否送达。',
  'help.guide.admin-channels.result':
    '管理员事件会发给应用内的每位管理员，如果你开启了，也会发到管理员的 ntfy 主题和 webhook。',
  'help.guide.admin-channels.tip.1': '把管理员主题和你的个人主题分开，这样故障通知就不会淹没在旅行消息里。',
  'help.guide.admin-channels.tip.2': '管理员的 webhook 和主题，与你在“设置”的“通知”中自己的渠道是分开的。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': '撤销 AI 访问权限',
  'help.guide.mcp-tokens-admin.goal': '查看并撤销 AI 客户端持有的所有令牌和会话，适用于任何用户。',
  'help.guide.mcp-tokens-admin.step.1':
    '在“OAuth 会话”下，按名称和所有者找到客户端，它的标签显示获得的权限范围。垃圾桶图标在你确认后撤销该会话。',
  'help.guide.mcp-tokens-admin.step.2':
    '在“API 令牌”下，令牌的操作相同：名称、所有者、“创建时间”和“最后使用”。垃圾桶图标会删除令牌，对应的客户端会立即停止工作。',
  'help.guide.mcp-tokens-admin.result': '该客户端的用户需要重新连接，其他内容不受影响。',
  'help.guide.mcp-tokens-admin.tip.1': '权限范围表示客户端能做什么；只读范围可以放心保留。',
  'help.guide.mcp-tokens-admin.tip.2':
    '关闭 MCP 扩展会立刻让所有客户端停止工作并隐藏此标签页，但不会删除任何内容，重新开启后令牌即可再次使用。',
  // release-history
  'help.guide.release-history.title': '检查是否有新版本',
  'help.guide.release-history.goal': '了解你的 TREK 是否是最新版本，以及下一个版本会带来什么。',
  'help.guide.release-history.step.1':
    '有更新的版本发布时，页面标题下方会出现“有可用更新”，并带有你当前运行的版本。点击“在 GitHub 查看”会打开该版本，“如何更新”则显示 Docker 的命令，其他安装方式显示更新指南。',
  'help.guide.release-history.step.2':
    '“版本历史”列出每个版本及其说明。“显示详情”展开说明，最新的版本带有“最新”标记，“加载更多”显示更早的版本。',
  'help.guide.release-history.result': '更新需要在主机上进行：拉取新镜像，或构建新标签。数据目录会保持不变。',
  'help.guide.release-history.tip.1': '更新前请先备份。“备份”标签页就在旁边。',
  'help.guide.release-history.tip.2': '预发布版本会显示出来，但不会作为更新提醒，除非你本身运行的就是预发布版本。',
  // create-backup
  'help.guide.create-backup.title': '创建并恢复备份',
  'help.guide.create-backup.goal': '备份整个实例，在别处保留一份副本，并随时可以恢复。',
  'help.guide.create-backup.step.1':
    '在“数据备份”下，点击右上角的“创建备份”。它会把数据库和上传的文件打包成服务器上的一个文件。',
  'help.guide.create-backup.step.2': '“下载”可以把副本保存到服务器之外，垃圾桶在你确认后删除旧备份。',
  'help.guide.create-backup.step.3':
    '对某个备份点击“恢复”，或用文件“上传备份”，然后在“恢复备份？”中点击“确认恢复”，就会替换所有当前数据。',
  'help.guide.create-backup.result': '恢复后，用户、旅行、文件和设置都会回到该备份当时的样子。',
  'help.guide.create-backup.tip.1': '恢复是这里唯一无法撤销的操作，请先做一份新的备份。',
  'help.guide.create-backup.tip.2':
    '备份保存在数据目录里。请把它们复制到另一台机器上，这样这台机器出故障时备份依然安全。',
  // auto-backup
  'help.guide.auto-backup.title': '设置定时备份',
  'help.guide.auto-backup.goal': '让服务器自动备份，并清理旧备份。',
  'help.guide.auto-backup.step.1':
    '在“自动备份”下，打开“启用自动备份”，并选择“间隔”（“每小时”“每天”“每周”或“每月”）、“执行时间”，每周或每月备份时还要选择“星期几”或“每月几号”。',
  'help.guide.auto-backup.step.2': '在“自动删除旧备份”下，选择备份保留多久，从 1 天到“永久保留”，然后点击“保存”。',
  'help.guide.auto-backup.result': '备份会按计划出现在列表中，超过你所选期限的旧备份会被删除。',
  'help.guide.auto-backup.tip.1': '“执行时间”使用的是服务器时间，下方的提示会写明服务器所在的时区。',
  'help.guide.auto-backup.tip.2': '服务器上的存储空间有限：通常保留 7 或 14 天就够了，并在别处另存一份下载的副本。',
  // audit-log
  'help.guide.audit-log.title': '查看审计日志',
  'help.guide.audit-log.goal': '查明谁在什么时候做了什么。',
  'help.guide.audit-log.step.1':
    '按最新在前的顺序阅读各行：“时间”“用户”“操作”“资源”、IP 和“详情”。操作按发生的事情命名，例如登录失败、MFA 变更或恢复。',
  'help.guide.audit-log.step.2':
    '右上角的“刷新”用于重新加载列表。标题旁的徽章显示已加载的条数和总数，“加载更多”会加载更早的条目。',
  'help.guide.audit-log.result': '有人问起为什么某处发生了变化时，你可以拿出这份记录。',
  'help.guide.audit-log.tip.1': '时间按服务器所在的时区显示。',
  'help.guide.audit-log.tip.2': '日志只能追加，这里的任何内容都无法在应用中编辑或删除。',
  // document-providers
  'help.guide.document-providers.title': '提供文档存储',
  'help.guide.document-providers.goal': '决定旅行可以和哪些存储同步文档。',
  'help.guide.document-providers.step.1':
    '“文档”卡片把各个存储服务列成多行：Paperless-ngx、Papra、Nextcloud、OpenCloud 和 Synology Drive。这五项一开始都是关闭的，而且只有“文档”本身开启时才会显示这些行。',
  'help.guide.document-providers.step.2':
    '打开 Nextcloud 那一行的开关。提示会显示“扩展已更新”，之后旅行所有者就能在旅行的“文件”标签页里看到“文档同步”，并在“连接文档服务”下找到 Nextcloud。',
  'help.guide.document-providers.result':
    '这台 TREK 上的每次旅行都可以使用该存储服务。在旅行所有者连接它之前，不会连接任何内容。',
  'help.guide.document-providers.tip.1':
    '这里只决定是否可以提供某个存储服务。地址和凭据属于具体的旅行，由旅行所有者在旅行的“文件”标签页中填写，绝不会在管理面板里填写。',
  'help.guide.document-providers.tip.2':
    '关闭“文档”会同时关闭所有存储，“文档”关闭时也无法开启任何存储：服务器会提示“Enable the Documents addon first”。位于你自己网络内的存储，还需要在服务器上设置 ALLOW_INTERNAL_NETWORK=true。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '关于一个旅行的一切：带有日期、地图和地点的计划，以及路线、交通、预订、列表、费用、文件、协作和关联旅程日志的各个标签页。每一项在本页之后都有各自的帮助页面。',
  'help.ctx.trip.bullet.1':
    '顶部栏下方的标签栏：计划、游览、交通、预订、列表、费用、文件、协作，关联旅程日志后还有旅程日志。你的 TREK 上有哪些标签页，取决于扩展和插件。',
  'help.ctx.trip.bullet.2':
    '“计划”分为三栏：左侧是日期，中间是地图，右侧是地点。启用公路旅行扩展后，日期栏顶部有“天”和“公路旅行”开关；启用游览扩展后，地点栏顶部有“地点”和“游览”。预订和交通是计划的一部分，出现在站点处和站点之间；标签页会把它们列出来。',
  'help.ctx.trip.bullet.3':
    '“旅行设置”是左上角旅行名称旁的标签，点击后打开旅行的设置：“成员”（成员和访客）、“分享中”（只读的公开链接和邀请链接）和“旅程日志”。',
  'help.ctx.trip.bullet.4':
    '标题、日期、封面和货币在“我的旅行”中编辑，使用旅行卡片上的铅笔图标。左上角的旅行名称会带你回到那里。',
  'help.ctx.trip.bullet.5':
    '栏内侧边缘的标签可以折叠该栏，地图会占用腾出的空间。折叠后，地图顶角会出现一个小图块，点击即可重新展开。拖动栏旁边的细分隔条可调整栏宽。',
  'help.ctx.trip.bullet.6': '日期工具栏中的撤销箭头可以逐步撤销你最近对计划所做的更改。',
  // add-member
  'help.guide.add-member.title': '添加成员',
  'help.guide.add-member.goal': '让已有 TREK 账户的人可以访问这次旅行。',
  'help.guide.add-member.step.1': '点击“旅行设置”，即左上角旅行名称旁边的标签，它会直接打开“成员”页面。',
  'help.guide.add-member.step.2': '在“邀请用户”下，从“选择用户…”中选出此人，点击“邀请”。',
  'help.guide.add-member.step.3':
    '这位成员现在出现在“访问权限”下。“所有者”徽章标出所有者。行末的“移除访问权限”在你确认后会移除该成员。',
  'help.guide.add-member.result': '成员可以像你一样查看和编辑这个旅行，具体范围取决于管理员在“权限设置”中设定的级别。',
  'help.guide.add-member.tip.1':
    '列表中找不到的人，说明还没有 TREK 账户。你可以把他们添加为访客，或者让他们通过邀请链接注册。',
  'help.guide.add-member.tip.2': '“访问权限”旁边的数字统计的是旅行中的人数；访客在下方单独列出。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '通过链接邀请',
  'help.guide.trip-invite-link.goal': '让别人自己加入旅行。',
  'help.guide.trip-invite-link.step.1':
    '点击旅行名称旁的“旅行设置”，在左侧选择“分享中”。在“行程邀请链接”下，点击“创建邀请链接”。',
  'help.guide.trip-invite-link.step.2': '点击“复制”并发送链接。任何拥有 TREK 账号的人打开链接，就会以成员身份加入。',
  'help.guide.trip-invite-link.step.3': '“重新生成”会替换链接，旧链接随即失效；“停用”会关闭链接。',
  'help.guide.trip-invite-link.result': '任何人打开链接即可加入旅行，并显示在“访问权限”下。',
  'help.guide.trip-invite-link.tip.1':
    '没有账户的人无法使用这个链接。管理员可以在“管理员”，“用户”下创建注册链接，并将其关联到这个旅行。',
  'help.guide.trip-invite-link.tip.2': '如果链接发错了聊天，就重新生成：旧链接会立即失效。',
  // add-guest
  'help.guide.add-guest.title': '添加没有账号的访客',
  'help.guide.add-guest.goal': '把不使用 TREK 的人也加入旅行。',
  'help.guide.add-guest.step.1': '点击旅行名称旁的“旅行设置”。在“成员”页面，“访客”是最后一部分，位于“访问权限”下方。',
  'help.guide.add-guest.step.2': '在“访客姓名”中输入名字，点击“添加访客”。',
  'help.guide.add-guest.result': '访客可以被分配到费用、行李物品和任务，但不能登录。',
  'help.guide.add-guest.tip.1':
    '“重命名”（铅笔图标）用来修改访客的名称。“移除访问权限”（垃圾桶图标）在你确认后移除该访客：其分配会被删除，其在每笔支出中的份额会由分摊中的其他人分担。',
  'help.guide.add-guest.tip.2': '如果这个人之后有了账户，请把他们邀请为成员，并移除对应的访客。',
  // public-link
  'help.guide.public-link.title': '发布只读链接',
  'help.guide.public-link.goal': '把旅行展示给不该编辑它的人。',
  'help.guide.public-link.step.1': '点击旅行名称旁的“旅行设置”，在左侧选择“分享中”。',
  'help.guide.public-link.step.2':
    '在“公开链接”卡片中，打开链接可以显示的内容。“地图与计划”始终开启，“预订”“行李”“费用”和“聊天”由你决定。',
  'help.guide.public-link.step.3':
    '在“选项”下，“仅交通和住宿”只会去掉活动、每日备注和空白日期，“不含照片”则去掉地点照片。',
  'help.guide.public-link.result': '任何拿到链接的人无需登录就能看到你选定的部分，但不能修改任何内容。',
  'help.guide.public-link.tip.1': '这个链接不会公开列出，但任何拿到链接的人都能打开，所以要像保管密码一样保管它。',
  'help.guide.public-link.tip.2': '如果要给编辑权限，请改为把对方添加为成员。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '移交旅行或退出旅行',
  'help.guide.transfer-ownership.goal': '让别人成为所有者，或者退出不属于你的旅行。',
  'help.guide.transfer-ownership.step.1':
    '点击旅行名称旁的“旅行设置”。在“访问权限”下，点击成员所在行的“设为所有者”（皇冠图标）并确认。',
  'help.guide.transfer-ownership.step.2':
    '点击你自己那一行的“退出旅行”，确认后你会退出该旅行。如果你是所有者，请先移交所有权。',
  'help.guide.transfer-ownership.result': '新的所有者可以管理成员并删除旅行，你则变为普通成员。',
  'help.guide.transfer-ownership.tip.1': '在转让之前，所有者就是创建该旅行的人。只有所有者才能删除旅行。',
  'help.guide.transfer-ownership.tip.2': '其他成员那一行的“移除访问权限”是相反的操作：由所有者把该成员移出旅行。',
  // collapse-columns
  'help.guide.collapse-columns.title': '给地图腾出空间',
  'help.guide.collapse-columns.goal': '收起一栏，或者把它调宽。',
  'help.guide.collapse-columns.step.1':
    '点击天数栏内侧边缘带面板图标的小标签，收起这一栏，地图会占用腾出的空间。地点栏也有同样的小标签。',
  'help.guide.collapse-columns.step.2':
    '栏折叠后，地图顶角会出现一个带面板图标的小图块，提示文字是“计划”或“地点”。点击它即可重新显示该栏。',
  'help.guide.collapse-columns.step.3': '拖动栏与地图之间的细分隔线，即可调整该栏的宽度。',
  'help.guide.collapse-columns.result': '栏的宽度会被记住，下次访问时各栏会恢复展开。',
  'help.guide.collapse-columns.tip.1': '两栏可以同时收起，只留下地图。',
  'help.guide.collapse-columns.tip.2':
    '窗口较窄时只放得下一栏：打开一栏会折叠另一栏。手机上没有分栏，顶部的“旅程”“计划”和“地点”用来切换视图。',
  // undo-change
  'help.guide.undo-change.title': '撤销上一次更改',
  'help.guide.undo-change.goal': '撤销你对计划做的最后一次更改。',
  'help.guide.undo-change.step.1': '点击天数上方工具栏里的撤销箭头，它的提示会写出将要撤销的更改。',
  'help.guide.undo-change.result': '计划恢复成原来的样子，并有一条简短的消息说明撤销了什么。',
  'help.guide.undo-change.tip.1':
    '撤销涵盖整个计划：添加、分配、移除、重新排序、移动和锁定地点，清空某一天，优化路线，删除地点，分类变更和导入。',
  'help.guide.undo-change.tip.2':
    '再次点击可继续往前回退：TREK 会保留你在此旅行中最近的 30 次更改，最新的在前，直到你离开该旅行。',
  'help.guide.clear-day.title': '清空某一天',
  'help.guide.clear-day.goal': '一次性移除某一天的所有地点，比如想把这一天从头重新规划。',
  'help.guide.clear-day.step.1': '在计划中右键点击这一天的标题。',
  'help.guide.clear-day.step.2': '选择“清空当天”并确认。',
  'help.guide.clear-day.result': '这一天变为空白，其中的地点作为未规划地点回到列表中。点击天数上方的撤销箭头可以恢复。',
  'help.guide.clear-day.tip.1': '只会移除地点，当天的备注和预订都会保留。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '地点',
  'help.ctx.trip-places.summary':
    '计划的右栏：旅行的所有地点，无论是否已安排，带搜索、筛选和排序，也提供添加地点的几种方式：搜索、手动添加或从共享列表添加。顶部的“地点”和“游览”用来在地点和旅行路线之间切换。',
  'help.ctx.trip-places.bullet.1':
    '栏顶部的“地点”和“游览”用来切换列表。进入时默认打开“地点”。“游览”列出旅行的路线，并通过“导入 GPX 或 KML”导入 GPX、KML 和 KMZ 文件，路线不会显示在地点列表中。',
  'help.ctx.trip-places.bullet.2':
    '“添加地点/活动”会打开表单，用来搜索或手动输入地点。打开某一天时，按钮显示为“新地点”，旁边的“加入当天”会直接在那一天创建地点。',
  'help.ctx.trip-places.bullet.3':
    '旁边的图标按钮“导入地点”提供“列表导入”，用于从 Google 地图或 Naver Maps 分享的列表。如果管理员关闭了游览扩展，还会提供“导入文件”，支持 .gpx、.kml 和 .kmz 文件，也可以把文件直接拖到这一栏上。',
  'help.ctx.trip-places.bullet.4':
    '下面是“搜索”（也会搜索描述和笔记），旁边是“选择”复选框。再下一行是筛选：“显示”可在“全部”“未规划”和“计划中”之间切换，每项都带有数量。标签按钮按分类筛选，星形按钮按最低评分筛选，地球图标（旅行涉及多个国家或地区时才出现）按国家或地区筛选，“排序方式”设置列表的顺序。',
  'help.ctx.trip-places.bullet.5':
    '每一行显示图片、名称、描述或地址，有人评分后还会显示带平均分的星星。点击它查看地点详情，把它拖到某一天，或右键点击它（也可以点“更多选项”，即它的三个点）使用“编辑”“+ 天”“打开网站”“Google 地图”“保存到收藏”和“删除”。',
  'help.ctx.trip-places.bullet.6':
    '打开某一天后，行末的圆形 +（+ 天）会把地点加到那一天。它出现在每个还没加入那一天的地点上。此时“计划中”只列出那一天，标签“仅显示当前打开的日期”会提示这一点；标签上的 x，即“显示整个行程”，用来关闭当天视图。',
  // create-place
  'help.guide.create-place.title': '创建地点',
  'help.guide.create-place.goal': '手动添加地点或活动，填写计划所需的全部详细信息。',
  'help.guide.create-place.step.1':
    '点击地点栏顶部的“添加地点/活动”（打开某一天时是“新地点”）。表单打开后，光标会停在搜索框里。',
  'help.guide.create-place.step.2':
    '在“搜索地点…”中输入地点并选择一个结果。对话框顶部的名称、“地址”、“纬度”、“经度”和“网站”会自动填入，左侧的“地点详情”显示图片、营业时间和描述。在配置了 Google 密钥的 TREK 上，结果下方的“不是这个地点？改用 Google 搜索”会通过 Google 重新搜索。开启“收藏”后，右侧的“已保存的地点”会以同样的方式提供你列表中的地点。',
  'help.guide.create-place.step.3':
    '在“地点详情”中，点击“选择图片”下的一张图片，把它设为该地点的图片。“使用此文本”会把描述复制到表单中。',
  'help.guide.create-place.step.4':
    '检查表单中的字段。对话框顶部的名称是唯一必填项。名称下方的“分类”标签用来选择旅行中的一个分类，旁边的 + 可以新建分类。“地址”“纬度”和“经度”来自搜索，也可以手动输入。“描述”和“笔记”填你自己的文字。“网站”填链接，“文件”下的“附加”可以添加文档，“电话”“电子邮件”和“添加营业时间”用来补充搜索没有找到的信息。',
  'help.guide.create-place.step.5':
    '点击“添加”。如果旅行中已经有同名或同一位置的地点，TREK 会显示警告，按钮也会变成“仍然添加”。',
  'help.guide.create-place.result': '地点会出现在列表和地图上，在放到某一天之前，它位于“未规划”下。',
  'help.guide.create-place.tip.1':
    '启用预算扩展后，表单底部的“费用”会在保存后立即打开费用编辑器，用来录入该地点的支出。粘贴到对话框里的图片或 PDF，会像“文件”下的文件一样被附加。',
  'help.guide.create-place.tip.2':
    '每台 TREK 上的搜索结果都来自 TREK 索引和 OpenStreetMap，“地点详情”则自动从 Wikipedia、Wikivoyage 和 Wikimedia 获取。只有这两者都查不到时，TREK 才会去问 Google，而且评分只有 Google 才提供。',
  'help.guide.create-place.tip.3': '也可以直接在地图上创建地点：右键点击那个位置，表单会打开，并已填好坐标和地址。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '把地点直接加到当前打开的那一天',
  'help.guide.place-to-open-day.goal': '创建或选择一个地点，一步就把它加到当天。',
  'help.guide.place-to-open-day.step.1':
    '点击日期栏中某一天的标题，这一天就打开了：它的卡片高亮显示，地点栏里“新地点”旁边会出现“加入当天”按钮。',
  'help.guide.place-to-open-day.step.2':
    '“加入当天”打开的表单和“新地点”相同，但点击“添加”后，地点会直接加到当前打开的这一天。',
  'help.guide.place-to-open-day.step.3':
    '想把已有的地点加到当前打开的这一天，点击该地点行末的圆形 +（“+ 天”），或右键点击它并选择“+ 天”。凡是还没加入这一天的地点都会显示这个 +。',
  'help.guide.place-to-open-day.step.4':
    '反过来也可以，不必先打开某一天：把地点所在的行从栏中拖出，放到某天的卡片上。放在两个站点之间，它就会准确落在那个位置。',
  'help.guide.place-to-open-day.result': '地点会列在当天下方的末尾，上下拖动即可把它放到合适的位置。',
  'help.guide.place-to-open-day.tip.1':
    '展开的那一天也会影响搜索：有某一天处于展开状态时，地图和附近搜索会以这一天已有的地点为起点。',
  'help.guide.place-to-open-day.tip.2': '点击天数上方工具栏里的“撤销”，可以撤销这次分配。',
  // filter-places
  'help.guide.filter-places.title': '在列表中查找地点',
  'help.guide.filter-places.goal': '在这一栏里只显示你要找的地点。',
  'help.guide.filter-places.step.1':
    '搜索框下方的“显示”下拉菜单可以在“全部”“未规划”（还没安排到任何一天）和“计划中”（已安排到某天）之间切换，每项都带有数量。如果游览扩展已关闭，且导入过 GPX 轨迹，还会多出“轨迹”。',
  'help.guide.filter-places.step.2':
    '在顶部的“搜索”中输入内容。列表会随着输入缩小，按名称、地址、描述和笔记匹配；点击输入框里的 x 可清空。',
  'help.guide.filter-places.step.3':
    '“显示”旁边的标签按钮列出各个分类：勾选一个或多个，其中包括“无分类”。按钮上显示已勾选的数量，列表底部的“清除筛选”可以全部取消。',
  'help.guide.filter-places.step.4':
    '旁边的星形按钮设置最低评分：5+、4+ 等只保留平均评分不低于该值的地点。没有评分的地点会被隐藏。',
  'help.guide.filter-places.result': '“显示”上的数字表示有多少个地点符合条件，各个筛选条件可以叠加使用。',
  'help.guide.filter-places.tip.1':
    '打开某一天时，“计划中”只列出当天的地点，并提示“仅显示当前打开的日期”，旁边是“显示整个行程”。',
  'help.guide.filter-places.tip.2':
    '地图也会应用“显示”、分类和评分的筛选，打开某一天时，地图上的“计划中”只显示那一天。搜索和地球图标只筛选列表。',
  // edit-place
  'help.guide.edit-place.title': '修改地点',
  'help.guide.edit-place.goal': '修正名称、移动图钉、添加网站或更改分类。',
  'help.guide.edit-place.step.1':
    '右键点击该行并选择“编辑”，或点击行末的“更多选项”，也可以打开该地点，在详情中点击“编辑”。',
  'help.guide.edit-place.step.2':
    '在“编辑地点”中修改你需要的内容：对话框顶部的名称和“分类”标签，以及“地址”“纬度”和“经度”“描述”“笔记”“网站”“电话”“电子邮件”和营业时间。如果地点恰好安排在某一天，或你是从某一天打开它的，表单里还会有这一天的“开始”“结束”和“笔记”。',
  'help.guide.edit-place.step.3': '点击“更新”。',
  'help.guide.edit-place.result': '修改会应用到该地点出现的所有位置：列表、地图，以及它所在的每一天。',
  'help.guide.edit-place.tip.1': '“当天备注”属于这个地点在那一天的安排；“备注”属于地点本身。',
  'help.guide.edit-place.tip.2':
    '“结束”早于“开始”时无法点击“更新”；“时间冲突：”只是提醒你当天另一个停留点的时间与它相同。',
  // delete-place
  'help.guide.delete-place.title': '删除地点',
  'help.guide.delete-place.goal': '把一个地点从旅行中彻底删除。',
  'help.guide.delete-place.step.1': '右键点击该行并选择“删除”（行末的“更多选项”里也有），或在地点详情中点击“删除”。',
  'help.guide.delete-place.step.2':
    '在确认提示中点击“删除”。如果该地点上预订了住宿，或者有预订关联到它，提示会说明哪些内容会一并删除。',
  'help.guide.delete-place.result': '地点会从列表、地图和每一天中移除。点击天数上方工具栏里的“撤销”可以恢复。',
  'help.guide.delete-place.tip.1': '如果只想把地点从某一天移除，请改用该停留点上的“从当天移除”。',
  'help.guide.delete-place.tip.2': '要一次删除多个地点，点击搜索框旁边的对勾开始选择。',
  // select-places
  'help.guide.select-places.title': '一次修改或删除多个地点',
  'help.guide.select-places.goal': '一次修改多个地点，不用逐个操作。',
  'help.guide.select-places.step.1':
    '点击搜索框旁边的对勾。每一行会出现圆形复选框，栏的底部会出现一条带操作按钮的操作栏。',
  'help.guide.select-places.step.2': '点击各行即可勾选。操作栏里的双对勾“全选”会选中当前筛选结果显示的所有行。',
  'help.guide.select-places.step.3':
    '栏中显示已勾选的地点数量。“更改分类”会给所有已选地点设置同一个分类；“保存到收藏”（启用收藏时）把它们复制到你的某个收藏中；“删除所选”在确认后将它们移除。',
  'help.guide.select-places.step.4': '点击“完成”，也就是操作栏末尾的 X，结束选择。',
  'help.guide.select-places.result': '修改会应用到所有选中的地点；删除操作可以用天数上方工具栏里的“撤销”还原。',
  'help.guide.select-places.tip.1': '选择时筛选依然有效：先筛选出“未规划”，再点“全选”，就只会选中这些地点。',
  'help.guide.select-places.tip.2':
    '开启“收藏”扩展后，操作栏里会出现“在清单中标记为已去过”：它会把这些地点在其所属的收藏中标记为已去过。',
  // import-places-file
  'help.guide.import-places-file.title': '从 GPX、KML 或 KMZ 文件导入地点',
  'help.guide.import-places-file.goal':
    '如果“游览”扩展已关闭，可以把 Google 我的地图、Google 地球或 GPS 追踪器导出的图钉和路径作为地点导入。',
  'help.guide.import-places-file.step.1':
    '点击“导入地点”，即添加按钮旁边的图标按钮，选择“导入文件”，或把文件拖到地点栏的任意位置。只有管理员关闭了“游览”扩展时，这两种方式才可用。',
  'help.guide.import-places-file.step.2':
    '选择文件，或把它拖到框里。导入 GPX 时，勾选要导入的内容：“路点”“路线”“轨迹（含路径几何）”。导入 KML 和 KMZ 时，勾选“点（Placemarks）”和“路径（LineStrings）”。',
  'help.guide.import-places-file.step.3':
    '这个框可以一次接收多个文件，但只接受 .gpx、.kml 和 .kmz。其他类型的文件，或超过 10 MB 的文件，会在对话框中被拒绝，不会导入。',
  'help.guide.import-places-file.step.4':
    '点击“导入”。会有消息说明导入了多少个地点。对于 KML 或 KMZ 文件，对话框会保持打开，并显示已创建和已跳过内容的摘要。',
  'help.guide.import-places-file.result':
    '地点已在列表中。轨迹在它所在的行上带有彩色线条，会画在地图上，并有自己的“轨迹”筛选。',
  'help.guide.import-places-file.tip.1':
    '文件太大会被拒绝，TREK 会显示大小上限。请去掉照片后重新导出，或者把文件拆开。',
  'help.guide.import-places-file.tip.2': '可以在天数上方的工具栏中撤销整次导入。',
  // import-places-list
  'help.guide.import-places-list.title': '导入共享的 Google Maps 或 Naver Maps 列表',
  'help.guide.import-places-list.goal': '通过共享列表的链接导入地点。',
  'help.guide.import-places-list.step.1': '点击“导入地点”，即添加按钮旁边的图标按钮，然后选择“列表导入”。',
  'help.guide.import-places-list.step.2':
    '在“服务商”下选择“Google 列表”或“Naver 列表”，然后把列表的分享链接粘贴到“链接”中。Google 地图的路线链接也可以：其中的站点会按行驶顺序变成地点。',
  'help.guide.import-places-list.step.3': '点击“导入”。',
  'help.guide.import-places-list.result': '列表中的每个地点都已加入旅行，名称与列表中一致；旅行中已有的地点会被跳过。',
  'help.guide.import-places-list.tip.1': '列表必须公开共享；私有列表的链接什么也导入不了。',
  'help.guide.import-places-list.tip.2':
    '如果你的 TREK 配置了 Google 密钥，对话框中会出现“通过 Google 丰富地点信息”：它会逐个查找导入的地点，补全照片、地址和详情。',
  'help.guide.sort-places.title': '为地点列表排序',
  'help.guide.sort-places.goal': '按名称、评分，或按最近添加或修改的时间给列表排序。',
  'help.guide.sort-places.step.1':
    '点击“排序方式”，即筛选行末尾的箭头按钮。当前的排序方式前有勾号，按钮的提示文字会显示它的名称。',
  'help.guide.sort-places.step.2': '选择一种排序方式，例如“评分最高”，或按名称排序。列表会立即更新。',
  'help.guide.sort-places.result': '列表会一直按你选的顺序显示地点，直到你换成别的排序。',
  'help.guide.sort-places.tip.1': '除“最近添加”以外的任何排序都会让按钮高亮，这样你一眼就能看出列表的排序方式变了。',
  'help.guide.sort-places.tip.2': '排序只改变列表。各天保持自己的顺序，浏览器会记住你选的排序方式。',
  'help.guide.place-by-hand.title': '添加搜索找不到的地点',
  'help.guide.place-by-hand.goal': '地点搜索找不到时，自己输入地点，包括电话、电子邮件和营业时间。',
  'help.guide.place-by-hand.step.1':
    '在地点对话框中，把名称输入搜索框，然后按 Enter 键。如果没有找到结果，对话框会提示你，并提供“手动添加”。',
  'help.guide.place-by-hand.step.2': '点击“手动添加”。你搜索的文字会成为名称，对话框会滚动到联系方式字段。',
  'help.guide.place-by-hand.step.3': '如果知道，就填写“电话”和“电子邮件”。',
  'help.guide.place-by-hand.step.4':
    '点击“添加营业时间”，为每一天设置开门和关门时间。复制按钮会把第一天的时间应用到每一天，某一天的开关会把它标为“已关闭”。',
  'help.guide.place-by-hand.step.5': '点击“添加”。',
  'help.guide.place-by-hand.result':
    '地点已加入列表。它的详情会显示你填写的电话、电子邮件和营业时间，和搜索到的地点一样。',
  'help.guide.place-by-hand.tip.1':
    '编辑一个没有自己营业时间的地点时，会自动从左侧的“地点详情”复制营业时间。如果它已经有营业时间，旁边的按钮可以改用查到的营业时间。',
  'help.guide.place-by-hand.tip.2':
    '你输入的营业时间会取代查到的时间，所以营业时间随季节变化的咖啡馆，可以显示你所知道的时间。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '天',
  'help.ctx.trip-days.summary':
    '计划的左栏：每天一张卡片，按顺序列出当天的停留点、备注、当天的预订和交通，以及停留点之间的路线。旅行就是在这里真正规划出来的。',
  'help.ctx.trip-days.bullet.1':
    '顶部的标题栏：左侧是“导出”（PDF、日历、GPX）；右侧是撤销箭头、“展开所有日期”/“折叠所有日期”、“调整日期顺序”，以及在有预订带可绘制路线之后出现的“显示所有预订路线”。',
  'help.ctx.trip-days.bullet.2':
    '日期卡片：带日期编号和天气预报的图块、标题（在你命名之前显示为“第 1 天”）和日期，下方是表示当晚住宿的标签（入住日为绿色，退房日为红色，未确认时为虚线；点票据图标可打开预订）以及租车的标签。点击标题打开这一天，箭头用来折叠，+（“添加到当天”）打开一个菜单：“添加地点到这一天”“添加住宿”“添加交通”“公共交通”和“添加备注”。右键点击标题可打开相同的菜单，另外还有“清空当天”。',
  'help.ctx.trip-days.bullet.3':
    '一天之内：按顺序排列的站点，每个都有图片、分类图标、名称、时间和描述，还有与它关联的预订和同行的人；笔记；以及当天的预订和交通，按类型着色。把鼠标移到站点上，可以看到拖动手柄、图片上的锁、箭头、“添加预订”和三个点（“更多选项”）。站点和笔记也可以右键打开菜单。',
  'help.ctx.trip-days.bullet.4':
    '在已打开的这一天，有两个站点后，它们下方会出现路线栏：“路线”在地图上显示当天路线，并显示站点之间每一段的行程时间；三个图标为当天设置驾车、步行或骑行；然后是“优化”“在 Google Maps 中打开”和“在 CoMaps 中打开”。',
  'help.ctx.trip-days.bullet.5':
    '有几种方式可以把地点加到某一天：从地点栏拖一行过来，使用该行上的“+ 天”，使用这一天的 + 菜单或空白日里的“添加地点到这一天”，或者在地点详情里添加。',
  'help.ctx.trip-days.bullet.6':
    '底部的“总费用”汇总“费用”中属于当天站点和预订的支出，每笔只计一次，按你的显示货币计算。',
  // read-day-plan
  'help.guide.read-day-plan.title': '看懂一天的安排',
  'help.guide.read-day-plan.goal': '在改动之前，先弄清楚日期卡片上每个部分的含义。',
  'help.guide.read-day-plan.step.1':
    '标题栏：带日期编号和天气预报的图块，然后是“第 1 天”或你起的标题，以及日期。下面是当晚住宿的标签（入住日为绿色，退房日为红色，未确认时为虚线，上面的票据图标可打开预订）和租车。点击标题栏可打开这一天（详情面板会在地图上方打开）。右侧的 +（“添加到当天”）可添加地点、住宿、交通、公交换乘或备注，箭头用来折叠卡片。',
  'help.guide.read-day-plan.step.2':
    '每个站点显示图片、分类图标和名称，设置了“开始”时间后还有时间，以及描述。“当天备注”显示在它下方。鼠标移到该行上时会出现控件：左侧的手柄用来拖动，图片会变成用于路线优化的锁，右端是箭头（“上移”“下移”）、“添加预订”和三个点（“更多选项”）。',
  'help.guide.read-day-plan.step.3':
    '站点上的预订以“预订”徽章显示，确认后为绿色，待确认时为琥珀色，并带有时间和承运方。点击徽章可打开预订，旁边的路线按钮会画出它的路线。交通有单独的一行，按类型着色，带有时间以及“出发”或“到达”。点击预订可打开详情，在详情里点“编辑”即可修改。',
  'help.guide.read-day-plan.step.4':
    '开启“路线”后，两个站点之间的连接线会按当天的出行方式，显示这一段需要多久、有多远。点击它，可以只改这一段的出行方式。',
  'help.guide.read-day-plan.step.5':
    '打开的某一天，站点下方有路线栏：“路线”在地图上画出当天的路径，三个图标用来选择“驾车”“步行”或“骑行”，“优化”重新排列站点，“在 Google Maps 中打开”和“在 CoMaps 中打开”会在那里打开当天的路线。',
  'help.guide.read-day-plan.result': '卡片上的每个符号都有含义，下面的指南会逐一说明如何修改。',
  'help.guide.read-day-plan.tip.1':
    '右键点击站点，或点击它的三个点，打开菜单：编辑、从当天移除、从路线中排除、打开网站、保存到收藏、删除。导航应用在地点详情的“导航”下。',
  'help.guide.read-day-plan.tip.2':
    '把鼠标移到某个停靠点上，行末会出现“添加预订”。在那里创建的预订会关联到当天的这个停靠点。',
  // place-onto-day
  'help.guide.place-onto-day.title': '把地点放到某一天',
  'help.guide.place-onto-day.goal': '把列表里的地点变成某一天的停留点，并放在顺序中合适的位置。',
  'help.guide.place-onto-day.step.1':
    '把地点栏中的一行拖到当天的卡片上。放在两个站点之间，就会精确落在那个位置，放在当天的标题上则加到末尾。',
  'help.guide.place-onto-day.step.2':
    '不拖动的做法：点击标题打开这一天，然后点击地点行末的圆形 +（“+ 天”），或右键点击该行并选择“+ 天”。',
  'help.guide.place-onto-day.step.3':
    '这一天的 + 菜单里，或空白日上的“添加地点到这一天”会打开地点表单，新地点会立即加到这一天。',
  'help.guide.place-onto-day.step.4':
    '打开某一天后，在地点详情中点击“添加到当天”，就会把它放到那一天。点击地点栏标题中的“加入当天”，则会直接在打开的这一天创建新地点。',
  'help.guide.place-onto-day.result':
    '这个地点现在是当天的停留点。它会带着这一天的编号显示在地图上，地点栏也会把它算在“计划中”。',
  'help.guide.place-onto-day.tip.1':
    '一个地点可以出现在多天里：第二天还是从地点栏把它放过去。如果是把停留点从一张日期卡片拖到另一张，则是移动它。',
  'help.guide.place-onto-day.tip.2': '标题栏中的撤销箭头可以取消这次安排。',
  'help.guide.place-onto-day.tip.3':
    '不能把停靠点放在两个有固定时间的条目之间，也不能放在已有时间的预订之前，计划始终按时间顺序排列。',
  // reorder-stops
  'help.guide.reorder-stops.title': '调整一天的顺序',
  'help.guide.reorder-stops.goal': '把停靠点上移、下移，或者移到另一天。',
  'help.guide.reorder-stops.step.1': '鼠标移到站点上，按住手柄把它拖到卡片中的新位置。',
  'help.guide.reorder-stops.step.2': '或者使用鼠标悬停时站点右端的箭头（“上移”“下移”）：每点一次移动一步。',
  'help.guide.reorder-stops.step.3': '把停留点拖到另一天的卡片上，就能移到那一天，它会从原来那天移除。',
  'help.guide.reorder-stops.step.4':
    '如果某个站点固定了时间，而移动会打乱当天的顺序，TREK 会询问“移除时间？”，因为时间决定了该站点的位置。点“确认”会去掉时间，站点就可以放到任何位置；点“取消”则保持当天原样。',
  'help.guide.reorder-stops.result': '路线和行程时间会立即按新的顺序更新。',
  'help.guide.reorder-stops.tip.1':
    '固定了时间的预订会停在由其时间决定的位置，把它放到当天的其他位置，它会弹回原处。把它拖到另一天的卡片上，则会移到那一天。',
  'help.guide.reorder-stops.tip.2':
    '当天有三个或更多站点时，路线栏中的“优化”会按最短路径给全天排序。想让某个站点保持原位，请先锁定它。',
  // set-stop-times
  'help.guide.set-stop-times.title': '给停留点设置时间',
  'help.guide.set-stop-times.goal': '设定停留点的开始和结束时间，让这一天像一份时间表。',
  'help.guide.set-stop-times.step.1':
    '右键点击停靠点，或点击它的三个点，然后选择“编辑”。从当天打开表单时，位置下方就是这一天的“开始”和“结束”。',
  'help.guide.set-stop-times.step.2':
    '填写“开始”，需要的话再填写“结束”。“时间冲突：”会提示当天另一个有时间的停靠点与它重叠。“结束”早于“开始”时，无法点击“更新”。',
  'help.guide.set-stop-times.step.3': '点击“更新”。停靠点会显示时间标签，并按时间移到当天的正确位置。',
  'help.guide.set-stop-times.result': '设了时间的停留点保持原来的位置，没设时间的停留点围绕它们排序。',
  'help.guide.set-stop-times.tip.1': '时间属于这一天的这个停留点；同一个地点在另一天可以设不同的时间。',
  'help.guide.set-stop-times.tip.2':
    '要手动移动有时间的停留点，直接拖动它。TREK 会询问“移除时间？”，点击“确认”后时间就会被移除。',
  'help.guide.set-stop-times.tip.3': '同一个表单里的“当天备注”适合记录只与这一天有关的信息，比如订位或票号。',
  // remove-from-day
  'help.guide.remove-from-day.title': '把停靠点从某一天移除',
  'help.guide.remove-from-day.goal': '把地点从某一天移除，但不从旅行中删除。',
  'help.guide.remove-from-day.step.1': '右键点击该站点，或点击它的三个点，选择“从当天移除”。',
  'help.guide.remove-from-day.step.2':
    '停靠点会从当天移除。地点仍保留在地点栏中，如果它没有安排在其他任何一天，就会显示在“未规划”下。',
  'help.guide.remove-from-day.result': '这一天、它的路线和费用都会更新。点击撤销箭头可以恢复这个停留点。',
  'help.guide.remove-from-day.tip.1': '同一个菜单里的“删除”会把这个地点从整个旅行中移除，包括每一天。',
  'help.guide.remove-from-day.tip.2': '“从当天移除”也在地点的详情面板里，就在“添加到当天”旁边。',
  // lock-stop
  'help.guide.lock-stop.title': '把停留点锁定在原位',
  'help.guide.lock-stop.goal': '优化路线时，让某个停靠点保持在原来的位置。',
  'help.guide.lock-stop.step.1': '把鼠标移到停靠点的图片上，点击锁图标：“路线优化时保持位置”。',
  'help.guide.lock-stop.step.2': '“优化”会围绕它来排列其他停靠点。再次点击锁图标（“点击解锁”）即可解锁。',
  'help.guide.lock-stop.result': '图片上会显示锁图标；在你解锁之前，这个停留点会一直保持原来的位置。',
  'help.guide.lock-stop.tip.1': '固定了时间的停留点由时间锁定，优化时绝不会移动。',
  'help.guide.lock-stop.tip.2':
    '锁定只在刷新页面前有效。刷新后，所有停留点都会恢复未锁定，只有设了时间的停留点保持固定。',
  // day-note
  'help.guide.day-note.title': '给某一天添加备注',
  'help.guide.day-note.goal': '在当天记下提醒、票号或备用方案。',
  'help.guide.day-note.step.1': '点击当天标题栏中的 +（“添加到当天”），选择“添加备注”。',
  'help.guide.day-note.step.2':
    '在对话框顶部写着“备注”的位置输入备注的名称，日期卡片上显示的就是这个名称。其余内容写在“每日备注”中：上方的工具栏可以设置格式（粗体、列表、链接、引用），左侧的“预览”会显示这一行最终的样子。',
  'help.guide.day-note.step.3': '选择“图标”和“颜色”，让备注在停靠点中更容易辨认，然后点击“添加”。',
  'help.guide.day-note.step.4':
    '备注会像站点一样出现在当天：拖到合适位置，或用它的箭头调整。点击它即可编辑。“删除”在对话框里，也在它的三个点菜单或右键菜单中，会先询问“删除备注？”。',
  'help.guide.day-note.result': '备注属于当天，也会出现在 PDF 中，位置就是你拖放的位置。',
  'help.guide.day-note.tip.1': '备注中的链接会在新标签页中打开，单个换行也会保留为换行。',
  'help.guide.day-note.tip.2': '备注是按天记录的。整个旅行的备注请写在“协作”里。',
  // day-route
  'help.guide.day-route.title': '显示并优化当天的路线',
  'help.guide.day-route.goal': '查看停留点之间的路线，选择出行方式，并让 TREK 来排好顺序。',
  'help.guide.day-route.step.1':
    '打开某一天，点击站点下方路线栏中的“路线”：站点之间的路径会画在地图上，站点之间的连接线显示每一段的时间和距离。',
  'help.guide.day-route.step.2':
    '旁边的三个图标设置当天的出行方式：驾车、步行或骑行。各路段会重新计算。插件可以添加自己的出行方式。',
  'help.guide.day-route.step.3':
    '点击连接线可更改这一个路段的出行方式：选一种方式；选“公共交通”，在支持的地方为该路段搜索换乘方案；或选“使用当日默认”，恢复当天的出行方式。',
  'help.guide.day-route.step.4':
    '“优化”（圆形箭头）从三个站点起，按最短路径重新排列站点。带锁或固定了时间的站点保持原位。当天有住宿时，路线从住宿处开始。',
  'help.guide.day-route.step.5':
    '“在 Google Maps 中打开”或“在 CoMaps 中打开”会把整天的路线在该应用中打开，方便沿途导航，CoMaps 还会沿用当天的出行方式。',
  'help.guide.day-route.result': '这一天成为一条带时间的路线，顺序变化时，“总费用”和各路段会随之更新。',
  'help.guide.day-route.tip.1': '路线默认由 OSRM 提供；管理员可以在“用户默认设置”中让 TREK 改用其他路线引擎。',
  'help.guide.day-route.tip.2': '无法规划路线的路段不会显示用时。请检查两个停靠点是否都有坐标。',
  'help.guide.day-route.tip.3': '点击撤销箭头可以撤销一次优化。',
  // manage-days
  'help.guide.manage-days.title': '添加、调整顺序和重命名日期',
  'help.guide.manage-days.goal': '调整日期本身，而不只是日期里的地点。',
  'help.guide.manage-days.step.1':
    '日期由旅行的日期决定。在仪表盘上打开旅行的编辑表单修改日期，开头或结尾的日期会相应增加或减少。删除有内容的日期之前，会先列出哪些日期将被删除以及其中有什么。',
  'help.guide.manage-days.step.2':
    '标题栏中的“调整日期顺序”会打开一个列表：拖动手柄移动某一天，或使用“上移”和“下移”，这一天会连同地点、备注和预订一起移动。列表下方，“添加下一个日期”会在最后一个有日期的日子之后添加一天，并把旅行延长一天；“无日期”会在末尾添加一个没有日期的日子。没有日期的旅行只有“添加一天”。',
  'help.guide.manage-days.step.3':
    '行末的垃圾桶图标，即“删除这一天”，会先询问确认。它会列出随这一天一起删除的内容：这一天的地点、笔记和预订，在这天入住或退房的住宿，以及日期会提前一天的那些天。点“删除这一天”即删除，点“取消”则保留；最后一天不能删除。',
  'help.guide.manage-days.step.4':
    '要重命名某一天，打开它，点击地图上方详情面板中标题旁边的铅笔。这个名称会在卡片和 PDF 中取代“第 1 天”。',
  'help.guide.manage-days.step.5':
    '标题栏中的“展开所有日期”和“折叠所有日期”可一次展开或折叠所有卡片。要折叠单张卡片，点击它的箭头。',
  'help.guide.manage-days.result':
    '日期跟着位置走：把某一天上移，它就换成更早的日期，它的停留点、备注和预订也一起移动。',
  'help.guide.manage-days.tip.1': '移动日期可以用撤销箭头撤销，删除日期则不能。',
  'help.guide.manage-days.tip.2': '计划底部的“总费用”汇总整个旅行，“费用”标签页则给出明细。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '在计划中查看预订和交通',
  'help.guide.bookings-in-plan.goal': '了解预订创建后会显示在哪里，以及从哪个界面创建。',
  'help.guide.bookings-in-plan.step.1':
    '交通（航班、火车、渡轮、巴士、汽车）显示为一行，按类型着色，带有时间，在出发当天标“出发”，在抵达当天标“到达”。旁边的地球图标标明时区，有中转的航班每一段一行。公共交通换乘可点击箭头展开线路。点击一行会打开预订，在那里点击“编辑”即可修改。',
  'help.guide.bookings-in-plan.step.2':
    '关联到某个停靠点的预订（餐厅、旅游团）会在该停靠点上显示为“预订”标签，并带有时间。已确认时标签为绿色，待确认时为琥珀色。有日期但没有关联停靠点的预订，会在当天单独占一行。',
  'help.guide.bookings-in-plan.step.3':
    '在酒店住一晚属于住宿：当天标题中的标签在入住日是绿色，退房日是红色，票据图标会打开对应的预订。当天的详情面板把它列在“住宿”下，这些日子的路线也都从那里开始。',
  'help.guide.bookings-in-plan.step.4':
    '在地图上，预订行的路线按钮会画出它的路线；标题栏中的“显示所有预订路线”会画出全部路线。',
  'help.guide.bookings-in-plan.step.5':
    '创建方式：鼠标悬停站点时的“添加预订”、当天 + 菜单中的“添加交通”和“公共交通”，以及“预订”和“交通”标签页，那里有带导入和文件的完整列表。',
  'help.guide.bookings-in-plan.result': '每条预订在计划中只出现一次。各个标签页以列表形式显示同样的预订。',
  'help.guide.bookings-in-plan.tip.1':
    '“已确认”和“待确认”是你在预订上设置的状态；计划在站点上显示这个状态，“预订”标签页则两种都计入。',
  'help.guide.bookings-in-plan.tip.2':
    '把带时间的预订放到当天的其他位置，它会回到由其时间决定的位置。把它拖到另一天的卡片上，则会移到那一天。想改时间，请编辑这条预订。',
  // export-plan
  'help.guide.export-plan.title': '导出计划',
  'help.guide.export-plan.goal': '把计划导出为文档，导出到日历，或导出到 GPS 设备。',
  'help.guide.export-plan.step.1': '点击日期上方标题栏左侧的“导出”。',
  'help.guide.export-plan.step.2':
    '“文档：PDF”会打开每一天的打印视图，包含站点、备注和预订，开头是路线总览地图。“我的计划 PDF”只保留你参与的内容。在视图中，“每天分页”让每一天从新的一页开始，“交通备注”会加入你的交通备注，点击“保存为 PDF”即可下载。',
  'help.guide.export-plan.step.3':
    '“日历”：“下载 .ics”把预订保存为日历文件；“订阅日历”给出一个链接，日历应用会自动刷新它。',
  'help.guide.export-plan.step.4':
    '“地图与 GPS (GPX)”：“整趟行程”导出地点、每日路线和轨迹，“仅地点”只导出图钉，“按天生成路线”每天生成一条路线，适合离线地图和 GPS 设备。',
  'help.guide.export-plan.result': '文件会被下载，旅行里的内容不会有任何变化。',
  'help.guide.export-plan.tip.1':
    '想在地图应用中打开单独某一天，可以使用它的路线栏：“在 Google Maps 中打开”或“在 CoMaps 中打开”。',
  'help.guide.export-plan.tip.2': '“订阅日历”需要在你的设置中开启日历订阅，并且有权分享该旅行；“仪表盘”里有相关指南。',
  'help.guide.export-plan.tip.3': '导出只需要读取权限：旅行的每位成员都可以导出 PDF、.ics 和 GPX。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '地点详情',
  'help.ctx.trip-place.summary':
    '选择地点时在地图上方打开的卡片：旅行对这个地点所知的一切、每个人给它的星级评分、它的图片和文件，以及把它加到当前打开的那一天、在地图应用中打开或保存到列表的按钮。',
  'help.ctx.trip-place.bullet.1':
    '点击地点栏中的一行、某一天里的站点，或地图上的标记，卡片就会在地图上方打开。从某一天里打开时，卡片知道你指的是哪个站点，还会显示该站点的参与者和预订。路线（在“游览”标签页中创建的徒步、骑行或漫步）则会打开它自己的路线卡片。',
  'help.ctx.trip-place.bullet.2':
    '顶部显示圆形图片、名称、单行地址，以及已知信息的标签：营业中或已关门、分类、时间、价格、电话、电子邮件和坐标。点击图片可换成你自己的图片或地点文件中的照片，双击名称可直接重命名，右侧的 X 用来关闭卡片。图片、重命名、“编辑”和“删除”只对有权修改地点的旅伴显示。',
  'help.ctx.trip-place.bullet.3':
    '再往下是：所有出行人给这个地点的评分、描述和备注，以及停靠点带有备注时显示的“当天备注”。',
  'help.ctx.trip-place.bullet.4':
    '接下来是“营业时间”“轨迹颜色”“轨迹数据”和“文件”，视情况显示。“文件”标题中的“上传”用来从你的电脑添加文件，列表里还会显示固定在此站点上的文件和它所属预订的文件，包括酒店的确认单。插件可以在下方添加自己的行。',
  'help.ctx.trip-place.bullet.5':
    '底部一行：打开某一天时显示“添加到当天”或“从当天移除”，然后是“导航”（在“设置”中选好地图应用后，显示该应用的名称）、“打开网站”和“保存到收藏”。右侧，红色垃圾桶用来删除地点，“编辑”则打开它的表单。',
  'help.ctx.trip-place.bullet.6':
    '从搜索结果中选的地点会显示 TREK 索引或 OpenStreetMap 已知的信息：顶部标签中的“营业中”或“已关闭”，图片周围有绿色或红色圆环，依据地点当地时间判断；电话号码，同样是标签；更下方的“营业时间”，行内显示今天的时间，点击后展开整周；还有“打开网站”下的网站。Google 的评分只会出现在通过 Google 找到的地点上，且需要 TREK 配置了 Google 密钥。你自己在地点表单里填的营业时间、电话和电子邮件会取代查到的内容，也决定圆环的颜色。',
  // read-place
  'help.guide.read-place.title': '地点卡片上有哪些信息',
  'help.guide.read-place.goal': '在一张卡片里看到旅行中关于某个地点的全部信息。',
  'help.guide.read-place.step.1':
    '在天数栏中点击你想查看的停留点。卡片会在地图上方打开，该停留点在它所在的那一天里保持高亮。',
  'help.guide.read-place.step.2':
    '顶部：圆形图片、名称和地址排在一行，悬停提示里是完整地址。下方的标签按地点当地时间显示现在是“营业中”还是“已关闭”，图片周围有对应的绿色或红色圆环。标签还显示分类、时间、电话和电子邮件（点击会交给手机或邮件应用打开），在宽屏上还有精确坐标。右侧的 X 用来关闭卡片。',
  'help.guide.read-place.step.3':
    '头部下方的第一部分是“评分”：显示每位旅行者给这个地点打的星，以及平均分和投票人数。还没有人投票时显示“暂无评分”。',
  'help.guide.read-place.step.4':
    '接下来是描述，再往下是备注。两者都来自地点表单中的文字，并保留格式：列表、链接和粗体都能正常显示。',
  'help.guide.read-place.step.5': '“参与者”显示谁会去这个停靠点。在你移除某人之前，默认包含所有人。',
  'help.guide.read-place.step.6':
    '再往下是“营业时间”：这一行显示你正在查看的那一天的时段，点击可展开整周的营业时间，当天以粗体显示。“文件”就在它旁边。',
  'help.guide.read-place.result':
    '卡片会一直打开，直到你点 X 关闭或选择另一个地点。一周的营业时间保持展开，该地点所属的停留点在天数栏中仍会高亮。',
  'help.guide.read-place.tip.1':
    '从地点栏中选取时，卡片展示的是这个地点，而不是某个站点。所以它不显示参与者，只显示属于地点本身的预订，例如酒店的住宿。要看到全部内容，请在当天的计划里选取那个站点。',
  'help.guide.read-place.tip.2':
    '如果你有权修改地点，双击名称即可直接重命名，无需打开表单。按回车保存，按 Esc 放弃更改。',
  'help.guide.read-place.tip.3':
    '手动输入的地点只有表单中填写的信息。点击“编辑”，自己填写“电话”“电子邮件”和营业时间，或者在“搜索地点…”下的建议中选中该地点，再点击“更新”来自动查询。Google 评分需要 Google 密钥。',
  // rate-place
  'help.guide.rate-place.title': '给地点评分',
  'help.guide.rate-place.goal': '给地点打上你自己的星，并查看其他人给它的评分。',
  'help.guide.rate-place.step.1': '打开这个地点。星标行就在头部下方，显示目前所有投票的平均分，票数写在括号里。',
  'help.guide.rate-place.step.2': '点击你想给的星级。鼠标划过时星星会依次点亮，所以你能提前看到自己要给几星。',
  'help.guide.rate-place.step.3':
    '你的评分会立即计入平均分，旁边的头像表示谁评过分。把鼠标移到这一行上，可以看到每个人给的星级。',
  'help.guide.rate-place.step.4': '地点栏里该地点的那一行也会显示同样的平均分，所以在列表中很容易找到评分最高的地点。',
  'help.guide.rate-place.result':
    '旅行中的所有人都能在这个地点上看到你打的星。列表上方筛选行里的星标现在可以只显示达到最低评分的地点。',
  'help.guide.rate-place.tip.1': '每位旅行者都可以评分，即使在只有部分成员能修改地点的旅行里也一样。',
  'help.guide.rate-place.tip.2':
    '再点一次你已经打过的那颗星，就能撤销你的评分。如果没有人评过分，地点会重新显示“暂无评分”。',
  'help.guide.rate-place.tip.3': '星标旁边最多以头像显示六位投票者，提示里会列出所有人，并标出你自己。',
  // place-image
  'help.guide.place-image.title': '给地点换上你自己的图片',
  'help.guide.place-image.goal': '用你自己的照片替换自动生成的缩略图。',
  'help.guide.place-image.step.1': '从地点栏打开这个地点。',
  'help.guide.place-image.step.2':
    '把鼠标停在标题中的圆形图片上，会出现一个相机图标，提示文字是“上传图片”。点击它并选择文件。如果地点的文件中已有照片，TREK 会先让你选择：“从设备上传”，或“从附件中选择”下的某张图片。',
  'help.guide.place-image.step.3': '卡片顶部现在显示你的图片，一角带有一个红色小 X。',
  'help.guide.place-image.step.4': '同一张图片也会显示在地点栏里该地点的那一行，以及它在地图上的标记上。',
  'help.guide.place-image.result':
    '你的图片会在所有地方作为这个地点的图片使用：卡片、地点栏、当天的停留点、地图上的标记，以及共享的旅行。',
  'help.guide.place-image.tip.1': '支持 JPG、PNG、GIF 和 WebP，iPhone 的 HEIC 图片在上传时会自动转换。',
  'help.guide.place-image.tip.2': '点击角上的 X 会移除你的图片，恢复显示自动匹配的图片。地点本身不受影响。',
  'help.guide.place-image.tip.3':
    '如果你没有添加图片，TREK 会根据地点的坐标查找一张，找不到时显示分类的图标。只有有权修改地点的旅伴才能设置图片。',
  // place-day-assign
  'help.guide.place-day-assign.title': '把地点加到当前打开的那一天，或将其移除',
  'help.guide.place-day-assign.goal': '直接用卡片上的按钮操作，不用把行拖过整个规划器。',
  'help.guide.place-day-assign.step.1': '在天数栏中点击某一天的标题。这一天就成为当前展开的那天，卡片的操作都针对它。',
  'help.guide.place-day-assign.step.2':
    '在地点栏里点击一个不在那一天的地点。它的卡片会打开，底部那一行提供“添加到当天”。',
  'help.guide.place-day-assign.step.3': '点击“添加到当天”。停留点会加到那一天的末尾，按钮变成“从当天移除”。',
  'help.guide.place-day-assign.step.4': '停留点现在已在这一天里，排在列表末尾。把它向上拖到合适的位置。',
  'help.guide.place-day-assign.step.5': '“从当天移除”会把该停靠点再次从当天移除，卡片上又会显示“添加到当天”。',
  'help.guide.place-day-assign.result': '停靠点会被加入当天或从当天移除，地点本身不受影响。',
  'help.guide.place-day-assign.tip.1':
    '这个按钮只有在打开了某一天时才会出现。没有打开任何一天时，就没有可以添加地点的日期。',
  'help.guide.place-day-assign.tip.2':
    '如果把停留点从某一天移除，地点仍然留在旅行和地点栏里。“删除”才会把它从所有位置移除。',
  'help.guide.place-day-assign.tip.3':
    '由住宿预订加到当天的停留点不会显示这两个按钮。这一晚要在当天的住宿区块里添加或移除。',
  // place-participants
  'help.guide.place-participants.title': '指定谁去这个停留点',
  'help.guide.place-participants.goal': '为某一个停留点选择谁去，而不改变旅行成员。',
  'help.guide.place-participants.step.1': '点击某一天里的停靠点，卡片会打开，“参与者”中列出了旅行里的所有人。',
  'help.guide.place-participants.step.2':
    '点击某位出行人的标签，即可将他从这个停靠点移除。鼠标悬停在标签上时，名字会显示删除线。',
  'help.guide.place-participants.step.3':
    '只要有人不在其中，就会出现一个虚线的 +。点击它可以看到谁没有参加这个停靠点。',
  'help.guide.place-participants.step.4':
    '点击某个名字，把这个人重新加回来。所有人都加回来后，这个停留点又属于整个团队了。',
  'help.guide.place-participants.result': '这个停留点只显示你选中的旅行者，团队里的其他人那段时间可以自由安排。',
  'help.guide.place-participants.tip.1':
    '只有选中停留点时才会出现“参与者”，所以请在某一天里选这个地点，而不是在地点栏里选。而且只有旅行者多于一人的旅行才会出现它。',
  'help.guide.place-participants.tip.2': '没有选任何人，就表示所有人都去。所以停留点上的最后一位旅行者无法移除。',
  'help.guide.place-participants.tip.3': '没有自己账户的访客，也可以和其他人一样成为参与者。',
  // place-booking
  'help.guide.place-booking.title': '停靠点上的预订',
  'help.guide.place-booking.goal': '查看属于某个停靠点的预订，打开它，并为它关联新的预订。',
  'help.guide.place-booking.step.1':
    '打开该预订所属的停留点。卡片会在“预订”下把它列为一张单独的小卡片，上面是预订名称，以及“已确认”或“待确认”。',
  'help.guide.place-booking.step.2':
    '预订卡片显示“日期”“时间”和“预订码”，用标签显示预订的其他信息（航班号、站台、入住），以及预订的所有备注。',
  'help.guide.place-booking.step.3': '点击预订卡片，预订会在地图上方打开。',
  'help.guide.place-booking.step.4':
    '预订底部的“编辑”会打开预订自己的表单。表单中的“关联日程分配”用来把预订关联到停留点，这里已经显示了这个停留点。然后关闭表单。',
  'help.guide.place-booking.step.5':
    '要为某个停留点新建预订，请从天数栏开始：鼠标悬停在停留点上，点击末尾的票据图标“添加预订”。表单会以“新建预订”打开，并已关联到该停留点。',
  'help.guide.place-booking.result':
    '预订会关联到这个停靠点：它会显示在卡片和当天的行程里，它的文件也会列在这里的“文件”下。',
  'help.guide.place-booking.tip.1':
    '预订会显示在它固定的站点上，酒店预订无论从哪里打开，也都会显示在酒店上。没有站点的预订位于“预订”标签页。',
  'help.guide.place-booking.tip.2': '多条预订可以共用同一个停靠点，例如午餐和从同一地点出发的游览团。',
  'help.guide.place-booking.tip.3': '火车、航班或渡轮的预订，点击“编辑”会改为打开交通表单，即“交通”标签页使用的那个。',
  // place-files
  'help.guide.place-files.title': '把地点的票据和地点放在一起',
  'help.guide.place-files.goal': '把票、凭证或地图附到它所属的地点上。',
  'help.guide.place-files.step.1':
    '打开该地点。“文件”在详情下方，如果地点有营业时间，就在“营业时间”旁边；地点没有文件时，这里只显示“文件”。',
  'help.guide.place-files.step.2': '点击“文件”标题右侧的“上传”，选择文件。',
  'help.guide.place-files.step.3': '按钮上会显示该地点有多少个文件，列表也会自动展开。',
  'help.guide.place-files.step.4': '每一行显示文件的名称和大小。点击即可打开文件。',
  'help.guide.place-files.result': '文件已附加到地点，并计入卡片上的数量。它也会出现在旅行的“文件”标签页中。',
  'help.guide.place-files.tip.1':
    '“文件”还会列出固定在这个站点上的和附加在它的预订上的文件，所以酒店确认单会出现在酒店上。',
  'help.guide.place-files.tip.2': '“上传”可以一次选多个文件，其中的一张照片可以设为地点的图片。',
  'help.guide.place-files.tip.3': '如果你没有上传文件的权限，就不会显示“上传”按钮；地点上已有的文件仍然会显示。',
  // place-navigation
  'help.guide.place-navigation.title': '在地图应用或网站上打开地点',
  'help.guide.place-navigation.goal': '用你平时导航用的应用打开这个地点。',
  'help.guide.place-navigation.step.1': '打开这个地点，点击底部那一行里的“导航”。',
  'help.guide.place-navigation.step.2':
    '列表中是适合该地点的地图应用：Google 地图、Waze、Apple 地图、OpenStreetMap 和 CoMaps，在 Android 上还有“其他地图应用”。',
  'help.guide.place-navigation.step.3':
    '点击你常用的那个。只要可行，TREK 会把地点本身而不只是坐标交给该应用，这样你就能直接到达正确的入口。',
  'help.guide.place-navigation.step.4': '旁边的“打开网站”会在新标签页中打开地点自己的网站，那里有营业时间和门票。',
  'help.guide.place-navigation.result':
    '地图应用会定位到该地点，网站在新标签页中打开，旅行中的内容不会有任何改变。如果 TREK 已安装为应用，则由地图应用打开，而不是新标签页。',
  'help.guide.place-navigation.tip.1': 'Waze 会立即开始导航。其他应用只会打开这个地点，需要你再点一下才会开始导航。',
  'help.guide.place-navigation.tip.2':
    '具体提供哪些应用，取决于地点和你的设备：Android 上没有 Apple 地图，高德地图只对中国境内的地点提供，Waze、Apple 地图和 CoMaps 需要地点有坐标。“其他地图应用”会把地点交给你 Android 手机上的任意地图应用。',
  'help.guide.place-navigation.tip.3':
    '在“设置”的“打开地点方式”中选好你常用的地图应用，按钮就会显示它的名称，并直接打开它。某个地点只适用一个应用时，也是同样的效果。',
  // place-to-collection
  'help.guide.place-to-collection.title': '把地点保存到你的某个列表',
  'help.guide.place-to-collection.goal': '把这次旅行中发现的地点保存下来，留给下一次旅行。',
  'help.guide.place-to-collection.step.1': '打开该地点，点击卡片底部一行中的“保存到收藏”。',
  'help.guide.place-to-collection.step.2':
    '“保存到列表”会显示你拥有或共享的所有列表。右侧实心的书签标出已包含该地点的列表。',
  'help.guide.place-to-collection.step.3': '点击目标列表，地点会立即添加进去。',
  'help.guide.place-to-collection.step.4': '点击 X 关闭对话框，卡片中的按钮会显示“已保存”。',
  'help.guide.place-to-collection.result': '地点连同图片、备注和地址都已存入你的列表，可以留着下次旅行用。',
  'help.guide.place-to-collection.tip.1': '只有开启了“收藏”扩展，才会有这个按钮；扩展由管理员在“扩展”中开启。',
  'help.guide.place-to-collection.tip.2':
    '一个地点可以同时在多个列表中，在每个列表里有不同的状态：在一个里是想法，在另一个里是已去过。',
  'help.guide.place-to-collection.tip.3':
    '选择器顶部、地点名称下方的“标记为已去过”，会在列表中把该地点标为已去过。如果地点在你的多个列表中，按钮会显示“在所有清单中标记”，一次全部标记。“查看”会在“收藏”中打开你的列表。',
  // place-track
  'help.guide.place-track.title': '查看轨迹并给它指定颜色',
  'help.guide.place-track.goal': '查看导入的步行路线有多长，并在地图上认出哪条线是这条路线。',
  'help.guide.place-track.step.1': '地点栏里的轨迹行带有一小段线条，颜色与地图上的轨迹颜色相同。点击它。',
  'help.guide.place-track.step.2': '“轨迹数据”显示路径的长度，单位按你的设置显示。',
  'help.guide.place-track.step.3': '上方的“轨迹颜色”显示当前使用的颜色。点击这一行，即可打开色板。',
  'help.guide.place-track.step.4': '选一种颜色。地图上的线和该行上的描边都会随之改变。',
  'help.guide.place-track.step.5':
    '左边的虚线格“自动颜色”会让轨迹恢复默认颜色。右边的吸管会打开系统取色器，用来选择其他任何颜色。',
  'help.guide.place-track.result': '轨迹会用你选的颜色绘制，卡片里、地点栏中它的那一行以及地图上都是如此。',
  'help.guide.place-track.tip.1':
    '只有带路径的地点才有这两个区块：即在“游览”功能出现之前从 GPX、KML 或 KMZ 文件导入的地点，或在关闭了“游览”的 TREK 上导入的地点。“游览”开启时，新的 GPX 文件会变成一条路线，并打开它自己的路线卡片。',
  'help.guide.place-track.tip.2':
    '如果轨迹记录了海拔，还会显示最高点和最低点、累计上升和下降的米数，以及这段步行的海拔剖面图。',
  'help.guide.place-track.tip.3': '导入时，每条轨迹都会分配到各自的颜色，所以两段步行路线不会用同一种颜色。',
  // read-place
  'help.guide.read-place.step.7':
    '底部一行是你可以在这里执行的操作：把地点放到当前打开的那一天或从中取下，在地图应用或它的网站上打开，保存到列表；右侧是删除（红色垃圾桶）或编辑。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '文件',
  'help.ctx.trip-files.summary':
    '旅行的所有文档都在同一个列表里：车票、确认单、通行证和图片。每份文档都可以写备注，可以关联到所属的地点或预订，还有回收站，可以随时恢复。',
  'help.ctx.trip-files.bullet.1':
    '“将文件拖放到此处”是栏下方的虚线框，可以接收拖入的文件，点击它则打开文件选择器。框内会显示此 TREK 接受的文件类型和单个文件的大小上限（最大 50 MB，除非管理员另行设置）。',
  'help.ctx.trip-files.bullet.2':
    '顶部栏里有“文件”和筛选标签“全部”“PDF”“图片”“文档”，每个标签后面都带有数量。只要有文件被收藏，“全部”之后就会出现星标标签；只要有笔记带了附件，末尾就会出现“协作笔记”标签。',
  'help.ctx.trip-files.bullet.3':
    '每一行显示缩略图或文件类型、上传者、名称、名称下方的备注、大小和日期，以及每个关联一个徽章：用名称显示的地点、预订或交通（指向它会显示“日程计划”“预订”或“交通”），以及“来自协作笔记”。',
  'help.ctx.trip-files.bullet.4':
    '每一行末尾最多有五个图标，鼠标指向时会显示名称：“收藏”“分配”（铅笔）、“打开”“下载”和“删除”。“删除”不会再询问，文件会进入回收站，可以找回。离线时，笔记、链接、星标和回收站仍可使用，等 TREK 重新联网后会自动发送，只有上传文件和取消另一个链接需要联网。',
  'help.ctx.trip-files.bullet.5':
    '图片或视频以全屏打开，可用方向键切换，下方有一排缩略图。其他文档在对话框中打开，顶部是名称，下面是“在新标签页中打开”和“下载”。钱包通行证则直接下载。',
  'help.ctx.trip-files.bullet.6':
    '栏右端的回收站图标（“回收站”）会把列表切换为已删除的文件。在那里可以恢复或永久删除每个文件，栏里的“清空回收站”则一次删除全部。如果旅行已连接文档存储，或者一旦开启了某个存储，旅行所有者和管理员就会在回收站图标左边看到“文档同步”。',
  // files-upload
  'help.guide.files-upload.title': '把文档添加到旅行',
  'help.guide.files-upload.goal': '把车票、确认单或照片从下载文件夹上传到旅行中，旅行里的每个人都能打开。',
  'help.guide.files-upload.step.1': '打开旅行，点击标签栏中的“文件”。旅行的文档列在这里，上方是上传框。',
  'help.guide.files-upload.step.2':
    '点击“将文件拖放到此处”，选择一个或多个文件。文件会依次上传，上传期间框内显示“上传中...”。框内“或点击浏览”的下方，会列出此 TREK 接受的文件类型和单个文件的大小上限。',
  'help.guide.files-upload.step.3':
    '最后一个文件上传完成后，（如果旅行中有地点或预订）会自动为它打开“分配文件”，对话框顶部是文件名。“备注”下的“添加备注...”可以给文件加一条说明，下方的列表用来把文件关联到某个地点或预订。点击右上角的 × 关闭，关闭不会丢失任何内容。',
  'help.guide.files-upload.step.4':
    '新文件会出现在列表顶部，只有收藏的文件排在它们之前。每一行显示上传者、名称、大小和日期。图片带缩略图，其他文件显示文件类型。',
  'help.guide.files-upload.result': '文档已加入旅行，所有能看到这次旅行的人都可以打开和下载。',
  'help.guide.files-upload.tip.1': '也可以直接把文件从桌面拖到这个框里。文件悬停在上方时，框会高亮显示。',
  'help.guide.files-upload.tip.2': '按 Ctrl+V 可以把剪贴板中的图片直接添加到列表，所以预订的截图不用先保存成文件。',
  'help.guide.files-upload.tip.3':
    '上传需要有上传文件的权限，没有权限时根本不会出现上传框。不在允许列表中的类型会被拒绝并给出提示，不会上传任何文件。超过大小限制的文件（50 MB，除非管理员另行设置）在发送前就会被拒绝，提示里会写明限制。上传还需要联网：离线时 TREK 会告知，并且不会上传任何文件。',
  // files-link
  'help.guide.files-link.title': '把文档关联到地点或预订',
  'help.guide.files-link.goal': '让车票不只是在这个列表里，也能从它所属的那一天找到。',
  'help.guide.files-link.step.1': '点击行末的铅笔图标（“分配”）。“分配文件”随即打开，对话框顶部是文件名。',
  'help.guide.files-link.step.2':
    '在“备注”下，“添加备注...”可以输入一行文字，之后它会显示在列表中文件名的下方。按 Enter 键或离开输入框时就会保存。',
  'help.guide.files-link.step.3':
    '左侧“地点”下列出旅行的各个地点，按所在日期分组并标出日期，最后是“未分配”，用于没有安排在任何一天的地点。点击某一项即可勾选。',
  'help.guide.files-link.step.4': '右侧的“预订”和“交通”下面列出旅行的各项预订。点击文档所属的那一项，它也会打上勾。',
  'help.guide.files-link.step.5': '点击右上角的 × 关闭。这里没有保存按钮：每次点击都已经即时保存。',
  'help.guide.files-link.result':
    '这一行会显示备注，以及每条关联各一个徽章：一个是地点名称，一个是航班名称。把鼠标移到徽章上会显示“日程计划”或“交通”。这份文档也同时附加到了该地点和该航班上。',
  'help.guide.files-link.tip.1':
    '一个文件可以同时有多个关联，所以同一份确认单可以既属于酒店的预订，又属于酒店这个地点。',
  'help.guide.files-link.tip.2':
    '再点一次已勾选的条目，就会取消这个关联，文件本身保留。离线时，笔记和新的勾选会先保存，TREK 重新联网后再发送；只有取消另一种关联才需要联网。',
  'help.guide.files-link.tip.3': '反过来也一样：附在某个地点或预订上的文档也会出现在这个列表中，行上带有同样的徽章。',
  // files-star
  'help.guide.files-star.title': '把重要的文档放在最上面',
  'help.guide.files-star.goal': '标出真正会用到的那几份文档，这样在很长的列表里也能很快找到。',
  'help.guide.files-star.step.1':
    '点击行末的星标（“收藏”）。星标变成金色，文件名前面多出一颗星，指向这个按钮时提示变为“取消收藏”。',
  'help.guide.files-star.step.2': '列表会重新排序：收藏的文件排在所有其他文件之上，每组内部按时间从新到旧排列。',
  'help.guide.files-star.step.3':
    '工具栏的筛选标签中现在多了一颗星，紧跟在“全部”之后，旁边是收藏文件的数量。点击它，就只显示这些文件。',
  'help.guide.files-star.result': '收藏的文件会显示在列表最上面，并且有一个标签页只显示收藏的文件。',
  'help.guide.files-star.tip.1': '星标标签只有在有文件被收藏时才存在。取消收藏最后一个文件后，这个标签就会消失。',
  'help.guide.files-star.tip.2':
    '收藏需要与“分配”相同的权限，即“编辑文件元数据”。没有这项权限的成员能看到星标，但点击“收藏”不会有任何效果。',
  // files-filter
  'help.guide.files-filter.title': '在列表中查找文档',
  'help.guide.files-filter.goal': '只显示你要找的那类文档。',
  'help.guide.files-filter.step.1':
    '筛选标签位于顶部栏中的“文件”旁边：“全部”“PDF”“图片”和“文档”，每个标签旁边都有文件数量。',
  'help.guide.files-filter.step.2': '点击“PDF”：列表中只显示 PDF 文件。',
  'help.guide.files-filter.step.3':
    '另外两个标签页只有在旅行中有对应文件时才会出现。点击“协作笔记”：只要“协作”标签页中的笔记带有附件，它就会出现，点击后列表只显示这些文件。收藏星标标签页也是同样的道理，只要有文件被收藏就会出现。',
  'help.guide.files-filter.step.4': '选“全部”即可恢复完整列表。',
  'help.guide.files-filter.result': '列表只显示所选标签下的文件，每个标签上的数字表示文件的数量。',
  'help.guide.files-filter.tip.1':
    '这里没有文件夹，也不能重命名文件。要区分文档，可以使用“分配文件”里的备注、关联到地点和预订的链接，以及星标。',
  'help.guide.files-filter.tip.2':
    '列表始终按收藏的在前、然后最新的在前排序，所以今天上传的文档会排在上个月的文档之上。',
  // files-preview
  'help.guide.files-preview.title': '不离开 TREK 就能查看文档',
  'help.guide.files-preview.goal': '直接查看车票或图片，需要时再下载到你的设备上。',
  'help.guide.files-preview.step.1':
    '点击图片的名称或缩略图。它会全屏打开，左上角显示文件名及其在这些图片中的位置。视频也以同样的方式打开，并在那里播放。',
  'help.guide.files-preview.step.2':
    '使用两侧的圆形箭头、键盘的左右方向键，或底部的缩略图条，可以在列表当前显示的所有图片之间切换。',
  'help.guide.files-preview.step.3':
    '“在新标签页中打开”和“下载”是右上角 × 旁边的圆形按钮。点击 ×、按 Esc 键，或点击深色背景，都可以关闭图片。',
  'help.guide.files-preview.step.4':
    '不是图片的文档会改为在对话框中打开：顶部是名称，下面是“在新标签页中打开”和“下载”两个胶囊按钮，PDF 则在下方显示页面内容。点击右上角的 ×、按 Esc 键，或点击对话框外面，都可以关闭它。',
  'help.guide.files-preview.step.5': '行末的箭头（“下载”）会直接把文件保存到你的设备，无需先打开。',
  'help.guide.files-preview.result':
    '文档显示在屏幕上，同样的两个按钮可以在浏览器标签页中打开它，或把它保存到你的磁盘。',
  'help.guide.files-preview.tip.1': '在触摸屏上，可以左右滑动翻看图片，不用点击箭头。',
  'help.guide.files-preview.tip.2': '钱包通行证不会打开预览，而是直接下载，这样手机可以用钱包应用打开它。',
  'help.guide.files-preview.tip.3':
    '“在新标签页中打开”和“下载”都是用你的登录会话来获取文件的，所以从地址栏复制的链接对其他人无效。',
  // files-trash
  'help.guide.files-trash.title': '删除文档并恢复',
  'help.guide.files-trash.goal': '删除旅行中不再需要的文件，并恢复仍然需要的文件。',
  'help.guide.files-trash.step.1':
    '点击行末的垃圾桶（“删除”）。文件会立即从列表中消失，并显示“已移至回收站”的提示。不会有确认提问。',
  'help.guide.files-trash.step.2':
    '栏右端的回收站图标（“回收站”）会把列表切换为已删除的文件。栏的标题变成“回收站”，筛选标签和上传框都会隐藏。',
  'help.guide.files-trash.step.3': '回收站里的行是灰色的，带有两个图标：“恢复”可以恢复文件，“删除”会在确认后永久删除。',
  'help.guide.files-trash.step.4':
    '点击“恢复”。会弹出提示“文件已恢复”，这一行也会从回收站中消失，文件的备注和关联都会保留。',
  'help.guide.files-trash.step.5':
    '工具栏里回收站图标旁边的“清空回收站”，会永久删除回收站里剩下的所有文件。操作前浏览器会请你确认一次。再次点击回收站图标即可切换回文件列表。',
  'help.guide.files-trash.result': '文件会回到列表中原来的位置。',
  'help.guide.files-trash.tip.1':
    '一行上的“删除”不会先询问，这正是有回收站的原因：在你从回收站中删除之前，没有任何内容会真正离开 TREK。这一切在离线时同样可用，并在 TREK 重新联网后同步。',
  'help.guide.files-trash.tip.2':
    '删除和恢复文件需要有删除文件的权限。没有这项权限的成员，既看不到行上的“删除”，也看不到回收站里的按钮。',
  'help.guide.files-trash.tip.3': '在回收站中被永久删除的文件无法恢复。',
  // files-sync
  'help.guide.files-sync.title': '把文档与你的文档存储同步',
  'help.guide.files-sync.goal':
    '把旅行连接到你自己的文档存储：在这里上传的文件会保存到存储中，在存储中保存的文件也会出现在这里。',
  'help.guide.files-sync.step.1':
    '点击“文档同步”，它在工具栏右端、回收站图标的旁边。对话框会打开，标题下方是旅行的名称。左侧“连接文档服务”下列出了管理员已开启的存储，每个存储都有一行文字说明它的存放方式：Paperless-ngx 和 Papra 按标签存放，Nextcloud 和 Synology Drive 存放在文件夹中，OpenCloud 存放在空间中。右侧显示“尚未连接任何服务”。',
  'help.guide.files-sync.step.2':
    '点击你的存储，这里以 Nextcloud 为例。会打开一个较小的连接对话框，标题是存储的名称，并要求填写该存储所需的登录信息。',
  'help.guide.files-sync.step.3':
    '填写“地址”和该存储服务自己的登录信息：Paperless-ngx 需要“API 令牌”，Papra 需要“API 密钥”和“组织 ID”，Nextcloud 需要“用户名”和“应用密码”，OpenCloud 需要“用户名”和“应用令牌”，Synology Drive 需要“用户名”“密码”，如果账号要求，还要填“两步验证码”。只要存储服务提供应用密码或令牌，就请使用它们，千万不要用你的账号密码。Nextcloud 和 Synology Drive 还有一个选填的“基础文件夹”，TREK 会在其中查找旅行文件夹，这里填 /Reisen。底部的“接受自签名证书”只适用于你自己网络中使用此类证书的存储服务。',
  'help.guide.files-sync.step.4':
    '点击“测试连接”。TREK 会用你填写的信息连接该存储服务，页脚会显示“已连接，登录身份为”和账号名。如果凭据被拒绝或地址无法访问，页脚会显示相应的提示。两种情况下都不会保存任何内容。',
  'help.guide.files-sync.step.5':
    '点击“连接”。连接会随旅行一起保存，TREK 会询问旅行的文档应放在存储服务中的什么位置：存放这些文档的标签、文件夹或空间。只有其中的内容会被同步。点击“创建”时，“新建一个”会创建一个新的，名称取自旅行标题。“或使用已有的”下会列出现有的，点击其中一个，这里选的是文件夹 Autumn in Japan。',
  'help.guide.files-sync.step.6':
    '对话框重新打开：你的存储在左侧“当前行程”下列出，右侧的卡片显示它同步到哪里、上次运行时间和“立即同步”。第一次同步会自动开始，点击“立即同步”可以随时再同步一次。同步完成后，名称旁边的“尚未同步”徽章会变成绿点，鼠标悬停时显示“已同步”。流向条显示 TREK 和存储各有多少份文档，中间是“发往文档服务”和“来自文档服务”两条通道。点击右上角的 × 关闭对话框。',
  'help.guide.files-sync.result':
    '存储中原有的文档会出现在列表顶部，以你的名义上传；旅行中的每份文档也会进入存储，但来自“协作笔记”的文档除外。此后 TREK 会在后台检查存储，列表中的更改会同步到存储。',
  'help.guide.files-sync.tip.1':
    '只有旅行的所有者或实例管理员可以连接旅行，因为凭据可以访问存储中的整个账户。旅行连接之后，每位成员都能看到“文档同步”，可以打开它、查看卡片并点击“立即同步”。',
  'help.guide.files-sync.tip.2':
    '位于你自己网络内的存储，需要在 TREK 服务器上设置 ALLOW_INTERNAL_NETWORK=true，并且地址必须是那台机器在网络中的地址，不能是 localhost。否则“测试连接”会提示“不允许使用该地址。”',
  'help.guide.files-sync.tip.3':
    '点击“立即同步”旁边的图标“断开连接”时只会确认一次，然后结束连接，两边的所有文档都会保留。如果你再次连接同一个标签、文件夹或空间，TREK 会把它当作新的，并把里面的内容全部重新导入一遍。所以“断开连接”之后，请连接一个空的，不要再连原来那个。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日程详情',
  'help.ctx.trip-day-detail.summary':
    '点击某一天的标题后，在地图上方打开的面板。它从整体上展示这一天：名称和日期、你所在地的天气、这一天的预订，以及为这天订下的住宿晚数。',
  'help.ctx.trip-day-detail.bullet.1':
    '点击日期栏中某一天的标题，面板会在地图中部上方打开。再次点击同一个标题，或点击右侧的 X，即可关闭面板并取消选中这一天。从地点栏或地图打开某个地点时，面板会关闭，改为显示该地点。',
  'help.ctx.trip-day-detail.bullet.2':
    '标题栏显示这一天的名称和日期。名称旁边的铅笔用来重命名这一天。双箭头可以把面板收成窄条，让你重新看到地图。',
  'help.ctx.trip-day-detail.bullet.3':
    '顶部显示这一天的天气。“天气预报地点”说明预报针对哪个地点：当天的第一个停留点，或者你醒来时所在的酒店。',
  'help.ctx.trip-day-detail.bullet.4':
    '“预订”列出当天的预订，每条都标有类型、所属站点和时间。绿色表示已确认，琥珀色表示仍待确认，公共交通行程为蓝色，没有状态。点击一行即可打开该预订。',
  'help.ctx.trip-day-detail.bullet.5':
    '“住宿”显示覆盖这一天的每一晚预订，在对应的日子标有“入住”和“退房”，以及入住时间窗口、退房时间和确认号。住宿有预订时，下方的“预订”框会写明该预订以及“待确认”或“已确认”。点击它即可打开预订。',
  'help.ctx.trip-day-detail.bullet.6':
    '“添加住宿”为这一天添加一晚住宿：从旅行的地点中选择住处，选择它覆盖哪几天，并填写时间和代码。某一天标题中的 +（提示为“添加到当天”）里也有“添加住宿”，它会打开这个面板，表单已经展开。',
  // day-panel
  'help.guide.day-panel.title': '打开某一天并查看详情',
  'help.guide.day-panel.goal': '不用离开地图，就能看到一天的全部安排，包括天气、预订和住处。',
  'help.guide.day-panel.step.1': '在天数栏中点击某一天的标题栏。这一天会被选中，详情会在地图中间上方展开。',
  'help.guide.day-panel.step.2': '标题栏显示这一天的名称，在你给它命名之前是“第 1 天”，下面是日期。',
  'help.guide.day-panel.step.3':
    '顶部是这一天的天气。“天气预报地点”说明预报针对哪个地点：当天的第一个停留点，或者你前一晚住的酒店。',
  'help.guide.day-panel.step.4': '下方的“预订”列出落在这一天的预订及其时间。',
  'help.guide.day-panel.step.5': '“住宿”显示覆盖这一天的住宿晚数，“入住”和“退房”会出现在各自发生的那一天。',
  'help.guide.day-panel.step.6': '标题栏里的双箭头把面板收成窄条，旁边的 X 则关闭面板并取消选中这一天。',
  'help.guide.day-panel.result':
    '把面板收成细栏后，地图会腾出来，当天仍保持选中；关闭面板后，当天会取消选中，计划保持原样。',
  'help.guide.day-panel.tip.1': '点击面板标题栏的任意位置同样可以折叠面板，箭头只是其中一种方式。',
  'help.guide.day-panel.tip.2':
    '从地点栏或地图打开一个地点时，当天的面板会关闭，改为显示该地点的详情。再点一次当天的标题，就会重新显示当天的面板。',
  // day-weather
  'help.guide.day-weather.title': '查看当天的天气',
  'help.guide.day-weather.goal': '查看这一天你实际所在地点的天气。',
  'help.guide.day-weather.step.1':
    '“天气预报地点”表示这些数据对应哪个地点：当天的第一个停留点；如果当天没有停留点，则是你前一晚住的酒店。',
  'help.guide.day-weather.step.2': '大号数字是这一天的气温，旁边是最低和最高气温，以及用文字描述的天气状况。',
  'help.guide.day-weather.step.3': '它右边的小标签依次是：降水概率、降水量、最大风力，以及日出和日落时间。',
  'help.guide.day-weather.step.4':
    '最下方是当天的逐小时预报，每两小时一格：时间、图标、气温和降水概率。降水概率超过 50% 的时段会显示为蓝色。',
  'help.guide.day-weather.result':
    '天数栏里这一天的卡片，也会在编号下方用小字显示天气，所以整个行程的天气一眼就能看完。',
  'help.guide.day-weather.tip.1':
    '温度和风速使用“设置”中“显示”下的“温度单位”：如果选择“°F Fahrenheit”，同一份预报会以 °F 和 mph 显示。',
  'help.guide.day-weather.tip.2':
    '如果某一天既没有已定位的停留点，也没有前一晚的酒店，就完全不显示天气：预报始终针对某个地点，而不是整个旅行。',
  'help.guide.day-weather.tip.3':
    '超过 16 天后就没有预报了。这时显示的是往年同一日期的平均值，用 Ø 标出，下方也有说明。',
  // rename-day
  'help.guide.rename-day.title': '给这一天起个名字',
  'help.guide.rename-day.goal': '给某一天起个名字，比如“抵达京都”或“休息日”，而不是“第 5 天”。',
  'help.guide.rename-day.step.1': '打开这一天。标题栏写着“第 5 天”，下面是日期。',
  'help.guide.rename-day.step.2': '点击名称旁边的铅笔图标。',
  'help.guide.rename-day.step.3': '名称会变成输入框，输入你想要的名称。',
  'help.guide.rename-day.step.4':
    '按 Enter，或者点击其他地方即可保存；按 Esc 则取消修改。天数栏里这一天的卡片也会显示新名称。',
  'help.guide.rename-day.result': '新名称会取代面板中和天数栏卡片上的“第 5 天”，日期保持不变。',
  'help.guide.rename-day.tip.1': '如果清空输入框再保存，这一天就会重新叫“第 5 天”：没有名称时，显示的是序号。',
  'help.guide.rename-day.tip.2': '名称属于这一天，而不是这个日期。重新排列日期后，名称会和这一天的其他内容一起移动。',
  // add-accommodation
  'help.guide.add-accommodation.title': '为某一天预订住宿',
  'help.guide.add-accommodation.goal': '把酒店一次性加入计划，包括入住的天数、时间和确认号。',
  'help.guide.add-accommodation.step.1':
    '住宿必须先是这个旅行里的一个地点。请像创建其他地点一样，在地点栏中创建它：选择器只提供已经存在的地点。',
  'help.guide.add-accommodation.step.2': '打开你抵达的那一天，点击“住宿”下的“添加住宿”。',
  'help.guide.add-accommodation.step.3':
    '“应用到天数”决定住宿覆盖哪几晚：“开始”是入住日，“结束”是退房日，“全部”覆盖整个旅行。对话框顶部显示日期范围和晚数。',
  'help.guide.add-accommodation.step.4': '填写“入住”“截止”和“退房”，并把预订号填在“确认号”下。这四项都可以留空。',
  'help.guide.add-accommodation.step.5': '在“选择住宿”下选择住处。列表上方的“分类”可以把范围缩小到一个分类。',
  'help.guide.add-accommodation.step.6': '点击“保存”。',
  'help.guide.add-accommodation.result':
    '住宿会显示在它覆盖的每一天，第一天标“入住”，最后一天标“退房”。该住处会成为入住日的一个站点，因此地图上会显示前往那里的路线，“预订”标签页中也会出现一条酒店预订。',
  'help.guide.add-accommodation.tip.1':
    '选择器会以你进入时的那一天作为入住日，退房日是次日；保存之前，两者都可以修改。',
  'help.guide.add-accommodation.tip.2':
    '创建酒店时，请选择“Hotel”分类。这样点击列表上方的“分类”，一下就只显示你的酒店。',
  'help.guide.add-accommodation.tip.3':
    '所有时间都是可选的：没有入住时间、也没有确认号的住宿，照样覆盖它的夜晚，路线也照样会画出来。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '修改或取消已订的住宿',
  'help.guide.edit-accommodation.goal': '调整住宿的日期、修改时间，或从计划中移除。',
  'help.guide.edit-accommodation.step.1':
    '卡片显示住处及其地址，在对应的日子里显示“入住”或“退房”及时间，还有确认号，并在“预订”下显示随之而来的那条预订。',
  'help.guide.edit-accommodation.step.2': '右侧的铅笔图标即“编辑住宿”，用来编辑这次住宿。弹窗标题此时为“编辑住宿”。',
  'help.guide.edit-accommodation.step.3': '修改“入住”“截止”“退房”和“确认号”。上方的日期和下方的住处也可以在这里更改。',
  'help.guide.edit-accommodation.step.4': '点击“保存”。',
  'help.guide.edit-accommodation.step.5':
    '铅笔旁边的 X 即“移除”，会删除这次住宿。它不会再确认，属于这次住宿的酒店预订也会一并删除。',
  'help.guide.edit-accommodation.result':
    '修改会立即作用于这次住宿覆盖的每一天，“预订”标签页上的酒店预订也会同步更新。',
  'help.guide.edit-accommodation.tip.1':
    '住宿期间中间的夜晚不显示“入住”和“退房”标签，只有这段日期的第一天和最后一天才有。',
  'help.guide.edit-accommodation.tip.2':
    '取消住宿时，也会同时移除它在入住日添加的停靠点，以及关联到该预订的所有费用。如果是误操作，请重新预订这一晚。',
  // day-bookings
  'help.guide.day-bookings.title': '一眼看完当天的预订',
  'help.guide.day-bookings.goal': '在一处看到这一天已经订了什么，以及是否已确认。',
  'help.guide.day-bookings.step.1':
    '“预订”列出当天的预订：日期在这一天的，以及固定在这一天某个站点上的。固定在另一天某个站点上的预订，只会显示在那个站点处。',
  'help.guide.day-bookings.step.2':
    '每一行显示预订的类型和名称；如果它属于某个停留点，名称后面会用灰色显示该停留点。预订时间显示在右端，状态圆点之前。',
  'help.guide.day-bookings.step.3':
    '颜色表示预订的状态：绿色是已确认，琥珀色是仍待确认，公共交通行程为蓝色，没有状态。酒店不在这个列表中，它们在下方有自己的区块。',
  'help.guide.day-bookings.step.4':
    '点击一行，预订就会打开。标题栏中的标签可以在“待确认”和“已确认”之间切换，底部的“编辑”用来修改其余内容。新预订要在“预订”标签页创建，交通要在“交通”标签页创建。',
  'help.guide.day-bookings.result': '日期在这一天的所有内容，以及关联到这一天某个停留点的所有内容，都在这个列表里。',
  'help.guide.day-bookings.tip.1':
    '预订会出现在它自身日期所在的那一天。如果你在“预订”或“交通”标签页中改了日期，预订会自动移到另一天。',
  'help.guide.day-bookings.tip.2': '没有“预订”板块，就说明这一天没有预订：它会被隐藏，而不是显示为空。',
  'help.guide.map-lock.title': '锁定地图',
  'help.guide.map-lock.goal': '在逐个点击日期和地点时，让地图保持在原位。',
  'help.guide.map-lock.step.1':
    '锁是地图左下角两个圆形按钮中靠上的那个，悬停时会显示“锁定地图视图”。点击它。锁定期间，打开某一天或选择某个地点时，地图不再缩放或平移，按钮此时显示“让地图跟随所选内容”。',
  'help.guide.map-lock.result': '你处理计划的时候，地图会停在你离开时的位置。',
  'help.guide.map-lock.tip.1':
    '再点一次锁，此时按钮显示“让地图跟随所选内容”，地图就会重新跟随你的选择。锁只在电脑上有，手机上的地图始终跟随。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '地图',
  'help.ctx.trip-map.summary':
    '计划的中间部分：旅行的每个地点是一个图钉，每条游览路线是一条线，还有它们之间的路径，以及地图边缘的按钮，用来锁定视图、切换卫星图、一次显示整个旅行，以及显示你正在查看的区域周围的地点。',
  'help.ctx.trip-map.bullet.1':
    '图钉代表一个地点：有自己的照片时显示照片，否则显示分类颜色和分类图标。把鼠标移到图钉上，会出现一张卡片，显示图片、名称和地址，如果地点有评分和分类，也会一并显示。把图钉拖到某张日期卡片上，就能把该地点规划到那一天。预订仍待确认的住宿会淡化显示，并带虚线圆环。',
  'help.ctx.trip-map.bullet.2':
    '靠得太近、无法分开的图钉会合并成一个带数字的深色圆圈。点击圆圈，地图会放大到其中的图钉。在“设置”>“显示”的“旅行与地图”下开启“未规划地点使用紧凑标记”后，尚未安排到任何一天的地点会变成不带照片的小圆点，已计划的站点就更容易辨认。',
  'help.ctx.trip-map.bullet.3':
    '点击图钉，地点会在地图底部的卡片中打开，显示它的评分、文件和后续操作。点击地图上的空白处可以关闭卡片。',
  'help.ctx.trip-map.bullet.4':
    '在日期栏中打开某一天后，该天的站点上会显示一个白色小徽章，标出它们在当天的编号；在当天出现两次的地点会显示两个编号。地点列表上方的筛选（“显示”、各分类以及用于设置最低评分的星形）同样会筛选地图上的图钉。',
  'help.ctx.trip-map.bullet.5':
    '顶部的一排图标用来搜索你当前能看到的这部分地图：餐厅、咖啡馆、酒吧与夜生活、住宿、景点、博物馆与文化、自然与公园和活动。插件添加的分类排在细分隔线之后。这一排比地图宽时，可以用鼠标滚轮横向滚动。移动地图后，点击“搜索此区域”会重新搜索。',
  'help.ctx.trip-map.bullet.6':
    '在地图上任意位置右键点击，会在该处打开地点表单，并已查好地址。左下角有两个圆形按钮：锁即“锁定地图视图”，在你逐日、逐个地点点击浏览时让地图视图保持不动。下面的“切换到卫星视图”则把绘制的地图换成卫星影像。',
  'help.ctx.trip-map.bullet.7':
    '右下角的“显示整个行程”会一次画出每个出行日，并列出每天的行程。预订所在行的路线图标会画出这一条预订，天数栏上方工具栏中的路线图标则会画出所有预订。点击已画出的预订路线的一端，可以打开它的详情。',
  'help.ctx.trip-map.bullet.8':
    '开启 Dawarich 扩展后，“显示整个行程”下方会出现圆形的 Dawarich 按钮，用来显示你手机实际记录的路线。“显示记录的路线”会把它画成虚线，叠在计划路线下方，每天一种颜色。没有线条时，按钮上的文字会告诉你原因。',
  // map-markers
  'help.guide.map-markers.title': '看懂地图',
  'help.guide.map-markers.goal': '了解地图上每个图钉、徽章和气泡的含义。',
  'help.guide.map-markers.step.1':
    '地图上显示旅行的每个地点。图钉挨得太近分不开时，会合并成一个深色圆圈，里面标着图钉数量。点击圆圈，地图会放大到这些图钉；放大到最大级别时，则会把图钉散开。',
  'help.guide.map-markers.step.2':
    '如果地点有自己的照片，图钉就显示照片，否则显示分类颜色和分类图标。预订仍“待确认”的住宿会淡化显示，并带虚线圆环。鼠标移到图钉上，旁边会展开一张卡片：同一张照片（更大）、名称和地址，如果地点有评分和分类，也会一并显示。',
  'help.guide.map-markers.step.3':
    '点击图钉，地点会在地图底部上方的卡片中打开：顶部是图片、名称和地址，然后是星级、描述和文件（包括它的预订的文件）。底部是可用的操作：打开某一天时有“添加到当天”（地点已在当天则是“从当天移除”）、“导航”、“打开网站”、“保存到收藏”（已在收藏里则显示“已保存”），右侧是垃圾桶和“编辑”。点击顶部的 X，或点地图的空白处，即可关闭。',
  'help.guide.map-markers.step.4':
    '在天数栏中打开某一天，这一天的停靠点就会带上编号：图钉角上的白色小徽章表示该停靠点在当天的顺序。如果同一个地点在当天出现了两次，会同时显示两个编号。没有打开任何一天时不显示编号，图钉角上会改为显示地点的评分（如果有的话）。',
  'help.guide.map-markers.step.5':
    '把图钉从地图拖到天数栏中某一天的卡片上，这个地点就会安排到那一天，效果与从地点列表中拖动它的行完全一样。',
  'help.guide.map-markers.result':
    '旅行本身没有任何变化：地图只是展示旅行的一种方式。每枚图钉都会显示它是哪个地点、在哪一天、排在第几位。',
  'help.guide.map-markers.tip.1':
    '在天数栏中收起某一天后，这一天的停留点也会从地图上隐藏。再次展开这一天，就能重新显示。',
  'help.guide.map-markers.tip.2':
    '地点列表上方的筛选同样决定地图上显示什么：“显示”（“未规划”“计划中”）、标签按钮下的分类，以及星形按钮下的最低评分，都会减少图钉数量。国家筛选只缩小列表。',
  'help.guide.map-markers.tip.3': '这张地图没有缩放按钮：滚轮缩放，双击放大一级，直接拖动地图则是平移。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '在地图上查找周边地点',
  'help.guide.map-nearby-places.goal': '在地图当前显示的这片区域里搜索餐厅、景点或酒店，并把其中一个加入旅行。',
  'help.guide.map-nearby-places.step.1':
    '地图顶部的一排图标是分类搜索：餐厅、咖啡馆、酒吧与夜生活、住宿、景点、博物馆与文化、自然与公园和活动。插件添加的分类排在细分隔线之后，把鼠标悬停在图标上可查看名称。',
  'help.guide.map-nearby-places.step.2':
    '点击一个分类。TREK 会在地图当前可见的范围内搜索这类地点，并为每个结果放一枚该分类颜色的图钉。一次只能选一个分类：点击另一个会替换当前的，再次点击已选中的则会关闭。',
  'help.guide.map-nearby-places.step.3':
    '移动地图后，这一排下方会出现第二个按钮：“搜索此区域”，它会在新的视野范围内重新执行同样的搜索。单纯移动地图不会自动发起新的搜索，这样可以减少请求次数。',
  'help.guide.map-nearby-places.step.4':
    '把鼠标停在图钉上，可以看到搜索结果的名称。点击图钉，会打开地点表单并已填好信息：对话框顶部的名称、“地址”、“纬度”和“经度”，以及搜索到的网站和电话。',
  'help.guide.map-nearby-places.step.5':
    '核对它填好的内容，再补充搜索无法得知的信息。如果旅行里有匹配的分类（例如餐厅对应餐厅），名称下的分类标签已经设好，否则显示“无分类”，直到你选一个。然后加上你自己的“描述”和笔记。',
  'help.guide.map-nearby-places.step.6':
    '点击“添加”。如果旅行中已经有同名或位于同一位置的地点，TREK 会提示你，按钮也会变成“仍然添加”。',
  'help.guide.map-nearby-places.result':
    '这个地点会出现在地点列表和地图上，成为旅行自己的图钉，在你把它排进某一天之前，都放在“未规划”下。搜索图钉会一直保留，直到你关闭该分类。',
  'help.guide.map-nearby-places.tip.1':
    '如果在“设置 > 显示”的“旅行与地图”下关闭了“在地图上探索地点”，这一排图标就不会显示。',
  'help.guide.map-nearby-places.tip.2':
    '结果来自 TREK 地点索引和 OpenStreetMap，所以这是计划中少数需要联网的功能之一。',
  'help.guide.map-nearby-places.tip.3':
    '搜索只覆盖屏幕上显示的区域，所以请放大到你感兴趣的那条街。对整座城市搜索时，只会返回前六十个结果，而且顺序没有明确规律。',
  // map-add-place
  'help.guide.map-add-place.title': '右键点击地图来创建地点',
  'help.guide.map-add-place.goal': '不用先搜索，直接把地点放在地图上你想要的位置。',
  'help.guide.map-add-place.step.1': '在地图上的目标位置点击右键。地点表单会打开，标题为“添加地点/活动”。',
  'help.guide.map-add-place.step.2':
    '“纬度”和“经度”已经设为该位置。TREK 会查询这组坐标，并用查到的内容填写“地址”。如果查到了名称，也会填入对话框顶部的名称。目前还没有保存任何内容，所以有不对的地方可以直接修改。',
  'help.guide.map-add-place.step.3':
    '在对话框顶部的输入框里输入一个你能认出的名称。再从下方的标签里选一个分类，选择前它显示“无分类”。然后补充计划需要的其他信息：“描述”“备注”“网站”。',
  'help.guide.map-add-place.step.4':
    '点击“添加”。即使当前展开了某一天，这个地点也会作为未规划的地点加入列表：在地图上右键点击确定的是位置，而不是日期。',
  'help.guide.map-add-place.result': '这个地点会出现在列表和地图上，在你把它排到某一天之前，它位于“未规划”下。',
  'help.guide.map-add-place.tip.1':
    '地址是根据坐标反查出来的，所以可能只显示街道而不是名称，在野外也可能是空的。这两个字段你都可以改写。',
  'help.guide.map-add-place.tip.2': '在 MapLibre GL 和 Mapbox GL 地图上，点击鼠标中键效果相同；在触摸屏上则是长按。',
  // map-satellite
  'help.guide.map-satellite.title': '切换到卫星地图',
  'help.guide.map-satellite.goal': '把绘制的地图切换为航拍影像，也可以再切换回来。',
  'help.guide.map-satellite.step.1':
    '底图切换开关是地图左下角两个圆形按钮中靠下的那个，在锁的下面。它的图标始终显示点击后会切换到的图层，悬停提示会写明：“切换到卫星视图”。点击它。',
  'help.guide.map-satellite.step.2':
    '地图现在显示航拍影像，清晰到能看出单栋建筑，而且不需要你自己的密钥。TREK 绘制的内容都会显示在影像上方：图钉、当天的路线、轨迹和预订路线。',
  'help.guide.map-satellite.step.3': '按钮现在显示“切换到地图视图”。点击它即可回到地图视图。',
  'help.guide.map-satellite.result': '地图会重新绘制，你选的图层也会记在你的账号上。',
  'help.guide.map-satellite.tip.1':
    '这个选择保存在你的账号上，而不是旅行上，所以无论你用哪种地图渲染方式，每次旅行都会按你上次的设置打开。',
  'help.guide.map-satellite.tip.2':
    '卫星影像上没有文字标注：街道名、城区和门牌号只显示在绘制的地图上，所以要找地址时请切换回去。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '查看整个行程及其距离',
  'help.guide.map-whole-trip.goal': '显示旅行的每个出行日，而不只是当前展开的那一天，并查看每天走了多远。',
  'help.guide.map-whole-trip.step.1':
    '圆形的“显示整个行程”按钮位于地图右下角。点击后，旅行的每个出行日会同时画出来，每一天各用一种颜色，这样相邻的日子也能区分开。',
  'help.guide.map-whole-trip.step.2':
    '按钮上方的卡片列出了这些天：一个色点、当天的名称、当天每种出行方式的图标，以及行程距离。“总距离”显示在最上面。',
  'help.guide.map-whole-trip.step.3':
    '在卡片中点击某一天即可选中：这一行会加上底色，这一天也会在天数栏中打开。把鼠标滚轮停在某座城市上滚动即可放大，经过该城市的几天会并排显示，各自使用自己的颜色。',
  'help.guide.map-whole-trip.step.4': '按钮现在显示“隐藏整个行程”。点击它即可重新只显示打开的那一天。',
  'help.guide.map-whole-trip.result': '每个出行日都用各自的颜色画出来，卡片上会显示每天的行程范围和整个旅行的总计。',
  'help.guide.map-whole-trip.tip.1':
    '总数是分几段陆续算出来的。数字后面显示 … 时，它还只是部分合计；每一段都算完后才是最终结果。',
  'help.guide.map-whole-trip.tip.2':
    '如果路线服务无法计算某一段，这一段会保持为直线，也不计入距离。卡片会告诉你这一点，这样总数偏低时不会没有提示。',
  'help.guide.map-whole-trip.tip.3':
    '如果某一天已定位的停留点不足两个，也没有往返酒店的驾车路程，就没有路线可画，所以卡片里完全不会出现这一天。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '在地图上显示预订的路线',
  'help.guide.map-booking-routes.goal': '在地图上显示你预订的航班、火车和自驾路线，也可以再把它们隐藏。',
  'help.guide.map-booking-routes.step.1':
    '预订路线默认是关闭的，需要你手动开启。天数栏里交通所在行的右端有一个小的路线图标：“显示预订路线”。',
  'help.guide.map-booking-routes.step.2':
    '点击它，预订就会显示在地图上：航班画成大圆弧，自驾沿着真实道路，火车则连成各个车站组成的线。“已确认”画实线，“待确认”画虚线，路线两端是带交通方式图标的蓝色胶囊标记。',
  'help.guide.map-booking-routes.step.3':
    '点击路线一端的标签，预订详情随即打开：状态、类型和日期以标签形式显示在彩色标题栏中，下面是两端的时间和其他信息，底部有再次关闭此路线的“在地图上”、公共交通换乘上的“更改路线”、用于删除预订的垃圾桶，以及“编辑”。标题栏中的 X 用来关闭详情。',
  'help.guide.map-booking-routes.step.4':
    '天数栏上方工具栏里的路线图标可以一次操作整个旅行：“显示所有预订路线”会画出所有带路线的预订。',
  'help.guide.map-booking-routes.step.5':
    '这会覆盖你之前的选择，所以你逐条预订打开的路线都会被重置。再按一次（此时按钮变为“隐藏所有预订路线”），就会隐藏所有预订路线。',
  'help.guide.map-booking-routes.result': '你选择的预订会画在地图上，这个选择会保存在当前浏览器里，直到你再次修改。',
  'help.guide.map-booking-routes.tip.1':
    '只有在“设置 > 显示”的“旅行与地图”下开启了“预订路线标签”，两端才会显示机场代码或车站名称，否则只显示图标。',
  'help.guide.map-booking-routes.tip.2':
    '同一部分里的“始终显示预订路线”，会让你还没有自己设置过的每个旅行从一开始就显示预订路线。',
  'help.guide.map-booking-routes.tip.3': '预订必须有带坐标的起点和终点才能画出路线，所以酒店或餐厅没有路线图标。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '显示你实际走过的路线',
  'help.guide.map-dawarich-trail.goal':
    '在地图上以虚线显示 Dawarich 在你手机上记录的路线，放在你计划的路线旁边，一天一天地查看这次旅行实际是怎么走的。',
  'help.guide.map-dawarich-trail.step.1':
    '圆形的 Dawarich 按钮在地图右下角、“显示整个行程”的下方。鼠标悬停时，它会显示“显示记录的路线”。点击它。TREK 会向你的 Dawarich 请求这次旅行日期范围内的数据，等待回复期间，按钮周围会有一圈转动的光环。',
  'help.guide.map-dawarich-trail.step.2':
    '记录的路线以虚线显示，每天一种颜色，画在计划路线下方，这样计划仍然清晰可读。按钮现在显示“隐藏记录的路线”。每一天以当地时间的午夜结束。在天数栏里收起某一天后，它的虚线和停留点也会从地图上隐藏。',
  'help.guide.map-dawarich-trail.step.3':
    '再点击“显示整个行程”，每个计划中的日子都会用实线画在虚线记录旁边。两条线重合的地方，说明那一天按计划进行；虚线偏离计划路线的地方，说明没有按计划进行。',
  'help.guide.map-dawarich-trail.result':
    '你的计划和实际行程会一起显示在地图上，虚线表示实际记录，实线表示计划。按钮上方的卡片仍然列出计划中的日子及其距离。',
  'help.guide.map-dawarich-trail.tip.1':
    '开关状态按旅行保存在你的账户中，所以在每个浏览器和每台设备上都一样。路线开启期间，TREK 每两分钟向 Dawarich 重新请求一次，所以进行中的旅行无需刷新页面就能更新。路线本身不会被保存，因此不在 TREK 的数据库里，不在备份里，离线时也无法使用。',
  'help.guide.map-dawarich-trail.tip.2':
    '按钮上的文字会告诉你地图为什么是空的：加载时显示“正在加载记录的路线…”，其他情况是“这些日期没有任何记录”或“无法加载记录的路线”，TREK 处于离线状态时则是“查看记录的路线需要网络连接”。',
  // map-compass
  'help.guide.map-compass.title': '旋转地图并重新找到正北',
  'help.guide.map-compass.goal': '把地图旋转到你前进的方向，再点一下就能转回正北。',
  'help.guide.map-compass.step.1':
    '按住右键拖动，或按住 Ctrl 再用左键拖动，即可旋转地图；在触摸屏上，用两根手指旋转。地图顶部分类图标旁边的圆形指南针会随之转动：它的箭头始终指向北，所以倾斜的角度与地图旋转的角度相同。',
  'help.guide.map-compass.step.2':
    '点击指南针。这个按钮叫“重置正北”，它会把地图转回正北朝上，恢复为平面视角，箭头也重新指向上方。',
  'help.guide.map-compass.result': '地图重新以正北朝上，并恢复为平面视角。旅行本身没有任何改变，指南针只改变视角。',
  'help.guide.map-compass.tip.1':
    '只有 MapLibre GL 和 Mapbox GL 地图才有指南针；Leaflet 地图不能旋转，所以没有指南针。用哪种地图，由“设置”中“地图”下的“地图提供商”决定，点击“保存地图”即可保存你的选择。',
  'help.guide.map-compass.tip.2':
    '点击指南针也会取消倾斜。按住鼠标右键上下拖动可以倾斜视角，“Reset north”会让视图回正并重置旋转。在 Mapbox GL 上开启“3D 建筑和地形”时，这也会把 3D 视图压平，直到你再次倾斜。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': '协作',
  'help.ctx.trip-collab.summary':
    '群组共同规划的标签页，分为五张卡片：左边是聊天，旁边是“笔记”和“链接”，它们下方是“投票”和“下一项”。这里写下的所有内容都会立即出现在其他每位成员的屏幕上，无需刷新。',
  'help.ctx.trip-collab.bullet.1':
    '聊天是左边那张卡片。在“输入消息...”中输入并按 Enter 发送，按 Shift 加 Enter 换行。笑脸用来添加表情符号，“附加图片”最多可以给消息添加四张图片。',
  'help.ctx.trip-collab.bullet.2':
    '把鼠标移到消息上会出现“回复”，自己的消息上还有“删除”；右键点击消息可以使用八种快捷表情回应。被删除的消息会替换为一条提示，说明是谁删除的。',
  'help.ctx.trip-collab.bullet.3':
    '“笔记”是共享笔记区：标题中的“新建笔记”用来写一条笔记，旁边的齿轮打开“管理分类”，设置分类的名称和颜色。有了分类之后，标题下方的一排标签可以筛选卡片：“全部”，或某一个分类。笔记卡片用彩色圆点显示分类，用圆形按钮显示链接，三个点菜单（“更多选项”）里有“展开”“置顶”“编辑”和“删除”。',
  'help.ctx.trip-collab.bullet.4':
    '“链接”用来收集旅行相关的网址。“添加链接”需要填写标题和 http 或 https 地址。“编辑链接”“固定链接”和“删除链接”在每个标签的末端，固定的链接会排在最前面。',
  'help.ctx.trip-collab.bullet.5':
    '用“投票”来做决定。“新建投票”提出一个问题，并至少设置两个选项。点击某个选项即可投票。投票头部右侧的锁（“关闭”）和垃圾桶（“删除”）分别用来结束投票或删除投票。',
  'help.ctx.trip-collab.bullet.6':
    '“下一项”列出旅行中尚未到来的停留点，最多八个，附带时间和同行的人。它只读取日程计划，时间要在日程里设置。',
  // write-note
  'help.guide.write-note.title': '写一条共享笔记',
  'help.guide.write-note.goal': '把整个群组都需要的内容，比如一条规则、一个地址或一条提醒，放在大家都能找到的地方。',
  'help.guide.write-note.step.1': '点击“笔记”卡片头部的“新建笔记”。笔记对话框会打开，光标已经在标题框里。',
  'help.guide.write-note.step.2':
    '在对话框顶部写着“笔记标题”的位置输入标题。这是唯一的必填项：标题为空时“创建”按钮保持灰色，在标题栏按 Enter 键会立即创建笔记。',
  'help.guide.write-note.step.3':
    '“内容”用来写正文，支持 Markdown：粗体、列表、标题都可以。卡片上显示前三行，点击卡片菜单中的“展开”可以查看整条笔记。',
  'help.guide.write-note.step.4':
    '在“分类”下，选择笔记所属的分类。它的颜色现在用于对话框的标题，之后用于卡片的标题。第一个分类已替你选好。这些标签是已有的分类，新分类在“管理分类”中创建。旅行里还没有分类时，不会显示这一行。',
  'help.guide.write-note.step.5':
    '“网站”可以填写与这条笔记相关的链接。卡片顶部随后会出现一个圆形的链接按钮，点击即可打开。',
  'help.guide.write-note.step.6':
    '点击“创建”。只有“取消”和对话框的叉号能关闭对话框，所以点击对话框外面或按 Esc 键都不会丢失你写的内容。',
  'help.guide.write-note.result': '笔记会成为“笔记”面板里的一张卡片，顶部是所属分类的颜色，其他所有成员会立即看到它。',
  'help.guide.write-note.tip.1':
    '卡片上的三个点（“更多选项”）里有“展开”“置顶”“编辑”和“删除”。“置顶”会让笔记固定在面板顶部，并加上与其颜色一致的边框。其余笔记按最后修改时间排序。',
  'help.guide.write-note.tip.2':
    '“新建笔记”旁边的齿轮会打开“管理分类”。在那里可以给分类设置颜色，一次性在所有位置重命名，或在任何笔记用到它之前就先建好。点击“保存”之前不会有任何改动。',
  'help.guide.write-note.tip.3':
    '如果你有权向旅行上传文件，“附加文件”可以把文档挂到笔记上。“附加”会打开文件选择器，你也可以直接把图片或 PDF 粘贴到对话框中。',
  'help.guide.write-note.tip.4':
    '“笔记”在“扩展”中、“协作”下方有自己的开关：管理员可以关闭它，同时保留聊天、链接、投票和“下一步”。',
  // shared-links
  'help.guide.shared-links.title': '收集旅行相关的链接',
  'help.guide.shared-links.goal': '把预订网站、共享相册和时刻表放在一个地方，不用再到聊天记录里翻找。',
  'help.guide.shared-links.step.1': '点击“链接”卡片头部的“添加链接”。对话框打开后，光标位于顶部的输入框中。',
  'help.guide.shared-links.step.2': '在“链接标题”中输入名称，把网址粘贴到下方的“链接”里，然后点击“保存链接”。',
  'help.guide.shared-links.step.3': '标签上显示名称和链接指向的网站。点击它，即可在新标签页中打开该页面。',
  'help.guide.shared-links.step.4':
    '它末尾的三个圆形按钮是“编辑链接”“固定链接”和“删除链接”。“固定链接”会把这个标签移到面板最前面，并用强调色显示。“删除链接”会先让你确认，因为链接会对所有成员一并删除。',
  'help.guide.shared-links.result':
    '链接会作为一个小标签出现在“链接”面板中，固定在最前面，并立即显示在每位成员的屏幕上。',
  'help.guide.shared-links.tip.1':
    '只接受 http 或 https 地址，其他的都会被拒绝，对话框保持打开，你输入的内容也不会丢失。',
  'help.guide.shared-links.tip.2':
    '固定的链接排在最前面，然后是最新的。标题旁边的小图标是网站自己的图标，直接从该网站加载，所以没有网络时，标签会显示一个普通的链接图标。',
  'help.guide.shared-links.tip.3':
    '“链接”在“扩展”中有自己的开关，位于“协作”下方，所以管理员可以关闭这个面板，而不影响标签页的其余部分。',
  // create-poll
  'help.guide.create-poll.title': '向大家提问',
  'help.guide.create-poll.goal': '把聊天里没人回答的问题，变成大家都能投票的投票。',
  'help.guide.create-poll.step.1': '点击“投票”卡片头部的“新建投票”。对话框随即打开。',
  'help.guide.create-poll.step.2':
    '在“问题”下写下问题。输入框下方的“支持 Markdown”表示这里可以使用粗体、换行或简短的列表。',
  'help.guide.create-poll.step.3': '在“选项”下填写“选项 1”和“选项 2”。至少需要两个不为空的选项，每个选项可以写多行。',
  'help.guide.create-poll.step.4':
    '它们下方的“添加选项”可以添加第三个、第四个选项，想加多少都可以。选项超过两个后，每行旁边会出现一个小叉，用来删除该选项。',
  'help.guide.create-poll.step.5':
    '“多选”允许每个人勾选多个选项。关闭时，如果有人改选别的选项，他的票就会转到新选项上。',
  'help.guide.create-poll.step.6': '点击“创建投票”。',
  'help.guide.create-poll.result': '投票会出现在“投票”面板顶部，处于开放状态，标题中显示 0 票。',
  'help.guide.create-poll.tip.1': '问题按 Markdown 渲染，选项保持纯文本。',
  'help.guide.create-poll.tip.2': '只有填写了问题，并且至少有两个带文字的选项后，“创建投票”才会变为可点击。',
  'help.guide.create-poll.tip.3':
    '截止时间只能在手机应用中设置。设有截止时间的投票，会在头部用琥珀色标签显示剩余时间，时间一到投票就会关闭。',
  'help.guide.create-poll.tip.4':
    '“投票”在“扩展”中、“协作”下方有自己的开关：管理员可以把它关闭，其余四个面板继续使用。',
  // vote-poll
  'help.guide.vote-poll.title': '投票并查看结果',
  'help.guide.vote-poll.goal': '投票、查看大家的结果，并可以修改自己的投票。',
  'help.guide.vote-poll.step.1': '点击你想选的选项。它的圆圈里会出现对勾，选项加上强调色边框，后面的条形也会变长。',
  'help.guide.vote-poll.step.2':
    '现在可以看到完整的结果：条形表示占比，百分比在右侧，小圆圈是选了该选项的人，最多显示三个。',
  'help.guide.vote-poll.step.3':
    '改主意了？点击另一个选项即可。在没有开启“多选”的投票中，你的票会转移到新选项上，而不是再多投一票。',
  'help.guide.vote-poll.step.4': '票数显示在问题下方的标签里。再次点击你已选的选项会撤回你的投票，票数也会随之减少。',
  'help.guide.vote-poll.result': '你选的选项会被勾上，条形显示大家的投票分布，圆圈显示谁选了哪个选项。',
  'help.guide.vote-poll.tip.1':
    '百分比和谁投了什么，要等你自己投过票或投票关闭后才会显示。头部的票数则所有人都能看到。',
  'help.guide.vote-poll.tip.2': '投票从不匿名：把鼠标移到某个选项上的圆圈上，就能看到投票人的名字。',
  // close-poll
  'help.guide.close-poll.title': '关闭或删除投票',
  'help.guide.close-poll.goal': '群组做出决定后结束投票，并删除不再需要的投票。',
  'help.guide.close-poll.step.1': '点击“关闭”，也就是投票头部右侧的锁图标，即可结束投票。之后无法再点击选项。',
  'help.guide.close-poll.step.2':
    '已关闭的投票会移到面板底部，上方还有进行中的投票时，它会位于“已关闭”标题下，带有“已关闭”标签，并向所有人显示结果，不管他们有没有投过票。获胜的选项在绿色条上以粗体显示；如果它正是你选的那个，条会改用你的强调色。',
  'help.guide.close-poll.step.3':
    '头部右侧的垃圾桶“删除”会删除整个投票。已关闭的投票上只剩这一个按钮，因为锁图标已经没有了。删除时不会再次确认，投票记录也会一并删除。',
  'help.guide.close-poll.result': '删除的投票会从每位成员的面板中消失。只是关闭的投票则仍显示在底部，并保留投票结果。',
  'help.guide.close-poll.tip.1': '关闭后无法撤销，也不能重新开启。误关的投票只能重新发起。',
  'help.guide.close-poll.tip.2': '“删除”会立即删除这个投票及其所有票数，对所有人生效，而且不会再确认。',
  // whats-next
  'help.guide.whats-next.title': '查看“下一项”',
  'help.guide.whats-next.goal': '不用打开计划，就能看到群组接下来要做什么。',
  'help.guide.whats-next.step.1':
    '这张卡片按时间顺序列出旅行接下来的停靠点，最多八个，按天分组，每天有一个标题：“今天”“明天”或具体日期，如果当天有标题，也会显示在旁边。头部会显示一共有几个。',
  'help.guide.whats-next.step.2':
    '每个停靠点的左侧是它的时间：开始时间、“至”，以及有结束时间时的结束时间；还没有设置时间时显示 TBD。',
  'help.guide.whats-next.step.3':
    '旁边是名称、地址，以及以标签形式显示的这个停靠点上的人。如果没有给这个停靠点指定人员，则会列出旅行中的所有人。',
  'help.guide.whats-next.result': '这是即将发生的事项清单，只读：它跟随计划变化，在这里做任何操作都不会改动计划。',
  'help.guide.whats-next.tip.1': '这里无需设置任何内容。时间来自日程计划；你在日程中修改后，这份清单会立即更新。',
  'help.guide.whats-next.tip.2':
    '只列出尚未发生的内容：站点的开始时间一过就会从列表中消失，今天没有时间的站点会保留到当天结束，旅行结束后面板为空。',
  'help.guide.whats-next.tip.3':
    '“下一项”在“扩展”中、“协作”下方有自己的开关。它是桌面端的面板，手机应用的“协作”标签页里不显示它。',
  // trip-chat
  'help.guide.trip-chat.title': '和群组聊天',
  'help.guide.trip-chat.goal': '发送消息、回复指定的某条消息、对别人的消息做出回应，以及删除自己的消息。',
  'help.guide.trip-chat.step.1':
    '在“输入消息...”中输入内容，然后按 Enter 键。输入框旁边的圆形箭头作用相同。按 Shift 加 Enter 则是换行。',
  'help.guide.trip-chat.step.2':
    '点击笑脸会打开表情选择器，里面有 Smileys、Reactions 和 Travel。你选中的表情会加到正在输入的内容里，不会自动发送。',
  'help.guide.trip-chat.step.3': '鼠标悬停在别人的消息上，消息一角会出现一个小圆按钮，那就是“回复”。',
  'help.guide.trip-chat.step.4':
    '你要回复的消息会显示在输入框上方作为引用。写好并发送，引用会随消息一起发出。点击引用上的叉号可以移除它。',
  'help.guide.trip-chat.step.5':
    '右键点击一条消息，会出现八个快捷表情回应。你的回应会显示在消息下方。再次点击同一个回应即可取消。',
  'help.guide.trip-chat.step.6':
    '你自己的消息在“回复”旁边有“删除”，也就是垃圾桶图标。它会立即删除消息，并留下一条提示，说明你删除了消息。删除后无法撤销。',
  'help.guide.trip-chat.result':
    '你的回复是最新的一条消息，顶部会显示被引用的那条消息。你的表情回应显示在对方消息的下方。你删除的那条消息会被替换为一条提示，说明是你删除的。',
  'help.guide.trip-chat.tip.1': '按 Enter 发送，按 Shift 加 Enter 换行。只含一到三个表情符号的消息会放大显示。',
  'help.guide.trip-chat.tip.2':
    '通过“附加图片”，一条消息最多可以添加四张图片。你也可以直接粘贴图片，或把图片拖到输入框里。',
  'help.guide.trip-chat.tip.3':
    '带链接的消息下方会显示预览卡片，由你自己的 TREK 获取，所以只有你能访问的链接仍然只是普通链接。',
  'help.guide.trip-chat.tip.4':
    '“聊天”在“扩展”中、“协作”下方有自己的开关：管理员可以关闭它，同时保留笔记、链接、投票和“下一项”。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '列表',
  'help.ctx.trip-lists.summary':
    '一个旅行有两份清单：行李清单，记录谁带什么、有多重；待办清单，记录出发前和旅途中需要完成的所有事项。只要“列表”扩展开启，这个标签页就会显示。',
  'help.ctx.trip-lists.bullet.1':
    '顶部栏里的“行李清单”和“待办事项”用于在两者之间切换，并分别显示各自的数量；栏右端的按钮对应当前打开的那一个。',
  'help.ctx.trip-lists.bullet.2':
    '行李清单按清单分组，例如“文档”或“衣物”，名称随你定。每个清单是一张卡片，标题栏有：用于把整个清单拖到其他位置的手柄、颜色圆点、“已打包数/总数”徽章、带有“重命名”“全部勾选”“取消全部勾选”和“删除清单”的三个点，以及折叠卡片的箭头。上方栏中的“添加清单”可以新建一个。',
  'help.ctx.trip-lists.bullet.3':
    '每一行依次是拖动手柄、勾选框和名称，然后是负责携带该物品的人的小头像。数量大于一的物品还有形如 3/10 的已打包计数器，带减号和加号。接着是小徽章形式的数量；开启“行李追踪”后，还有以克为单位的重量和表示包的圆圈，然后是垃圾桶和三个点菜单，菜单里有“移动到清单”“分享中”“重命名”和“删除”。一行中用不到的控件会保持暗淡，鼠标移上去才变亮。',
  'help.ctx.trip-lists.bullet.4':
    '“共享”和“我的清单”把行李清单分成两部分：所有人都能看到的清单，以及你自己的清单。旁边的“全部”“未完成”和“已完成”用来筛选当前打开的那个。行末的“按名称”会按名称顺序显示每个清单中的物品，再点一次则回到你自己的顺序。上方的进度卡片统计已打包的物品。',
  'help.ctx.trip-lists.bullet.5':
    '“应用模板”和“保存为模板”让你不用手动输入，就能填好一份清单或把它存起来。后面的两个图标“导出”和“导入”，分别把清单导出为打印件、PDF 或文件，以及导入一份清单。进度卡片右端的红色按钮显示已勾选的物品数，点击即可把它们清除。',
  'help.ctx.trip-lists.bullet.6':
    '“待办事项”有自己的侧栏：进度卡片，“全部”“我的任务”“已逾期”“已完成”这几个筛选，每个清单一行，下面是“添加清单”。任务放在一张卡片里，标题栏显示筛选名称和排序方式“优先级”或“截止日期”。点击任务即可在右侧面板中打开。栏里的“新建任务”会打开“新任务”对话框。',
  // packing-categories
  'help.guide.packing-categories.title': '创建行李清单',
  'help.guide.packing-categories.goal': '把要带的东西分组成清单，往清单里添加物品，并指定每份清单由谁负责。',
  'help.guide.packing-categories.step.1':
    '点击清单上方工具栏中的“添加清单”，会弹出一个小对话框。在顶部写着“清单名称（例如：衣物）”的位置输入名称，然后点击“添加”。',
  'help.guide.packing-categories.step.2':
    '新清单一开始是一个只显示三个淡色圆点的占位行。点击该行底部的“添加项目”，在“物品名称...”中输入物品，然后按 Enter 键：第一个物品会取代占位行，输入框保持打开，方便你继续输入下一个。',
  'help.guide.packing-categories.step.3': '点击行名即可重命名，也可以用行右端三点菜单里的“重命名”。',
  'help.guide.packing-categories.step.4':
    '清单顶部色带里带人像的虚线圆圈用来把旅行成员分配到这份清单。选一个名字；要再次移除这个人，点击出现的标签即可。',
  'help.guide.packing-categories.step.5':
    '数量旁边的三个点提供更多选项：“重命名”“全部勾选”“取消全部勾选”和“删除清单”。“删除清单”会直接删除清单及其所有物品，不会再次确认。最右边的箭头用来折叠清单。',
  'help.guide.packing-categories.result':
    '新清单会显示在网格里，物品列在下面，并带有颜色圆点，徽章显示已经打包了多少。',
  'help.guide.packing-categories.tip.1':
    '清单是靠物品存在的。删除最后一个物品后，这一行会变成占位行，让清单保留原来的位置和颜色；再删除这一行，清单就被删除了。',
  'help.guide.packing-categories.tip.2':
    '把某人分配到一份清单后，他会收到一条行李通知。这不会改变谁能看到这些物品，那由每一行三个点菜单里的“共享”决定。',
  'help.guide.packing-categories.tip.3': '两份清单可以重名。TREK 在内部会区分它们，所以名称会保持你输入的样子。',
  // check-off-packing
  'help.guide.check-off-packing.title': '边打包边打勾',
  'help.guide.check-off-packing.goal': '标记已装进包里的物品，查看进度条，并清除已打包的物品。',
  'help.guide.check-off-packing.step.1': '点击一行左侧的方框。名称会被划掉，进度条随之更新。',
  'help.guide.check-off-packing.step.2':
    '清单上方的进度卡片以数字、百分比和进度条三种方式，显示已打包物品数量占清单全部物品的比例。',
  'help.guide.check-off-packing.step.3': '要一次勾选整份清单：清单头部的三个点里有“全部勾选”和“取消全部勾选”。',
  'help.guide.check-off-packing.step.4':
    '“共享”和“我的清单”旁边的“全部”“未完成”和“已完成”可以筛选网格。“未完成”只显示还缺的物品，所以已经全部装好的清单会被隐藏。',
  'help.guide.check-off-packing.step.5':
    '进度卡片右端红色的“移除……已勾选”按钮，里面带有已勾选物品的数量，在浏览器确认一次后，会一次性删除所有这些物品。',
  'help.guide.check-off-packing.result': '只显示未完成的物品，上方的进度条显示行李已经收拾了多少。',
  'help.guide.check-off-packing.tip.1': '已勾选的物品仍可重命名：点击它的名称即可。',
  'help.guide.check-off-packing.tip.2':
    '“全部勾选”和“取消全部勾选”每次只对一份清单生效，要从该清单自己的三点菜单里使用。',
  'help.guide.check-off-packing.tip.3': '所有物品都勾选后，计数会换成“全部打包完成！”，进度条变成绿色。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '应用行李模板',
  'help.guide.apply-packing-template.goal': '把现成的清单加到旅行中，并把这次旅行的清单保存下来，留给下一次使用。',
  'help.guide.apply-packing-template.step.1': '点击清单上方工具栏中的“应用模板”。',
  'help.guide.apply-packing-template.step.2': '选择一个模板。每一行会显示模板名称和包含的物品数量。',
  'help.guide.apply-packing-template.step.3':
    '物品会加到你当前所在的视图：“已共享”加到所有人都能看到的共享清单，“我的清单”加到你自己的清单。',
  'help.guide.apply-packing-template.step.4':
    '要把这次旅行的清单留给下次旅行用，请点击“保存为模板”。会打开一个小对话框，在顶部显示“模板名称”的输入框里输入名称，然后点击“保存”。',
  'help.guide.apply-packing-template.result': '模板里的清单和物品会加到旅行中，与原有的内容并存。',
  'help.guide.apply-packing-template.tip.1':
    '模板会带入每件物品的清单、数量、重量和包，并创建旅行中还没有的包。勾选状态不会带入，清单中已有的内容也不会被移除。',
  'help.guide.apply-packing-template.tip.2': '只有存在模板时才会有“应用模板”。一个模板都没有时，这个按钮根本不会出现。',
  'help.guide.apply-packing-template.tip.3':
    '“保存为模板”只对实例管理员显示，而且只有清单中有物品时才会出现。它会保存共享物品和你自己的物品，绝不会保存其他成员的私人物品。',
  // import-packing-list
  'help.guide.import-packing-list.title': '粘贴整份行李清单',
  'help.guide.import-packing-list.goal': '把你在别处已有的清单，一次性变成行李物品。',
  'help.guide.import-packing-list.step.1': '点击“导入”，也就是清单上方栏右端带向下箭头的图标。',
  'help.guide.import-packing-list.step.2':
    '每行一个物品：类别、名称、重量（克，可选）、行李（可选）、checked/unchecked（可选）。输入框里的灰色示例展示了全部四种格式，左边缘的数字会统计你输入的行数。也可以使用 Markdown 列表：标题作为清单名称，“- [ ]”和“- [x]”会变成物品。',
  'help.guide.import-packing-list.step.3':
    '也可以用对话框左下角的“加载 CSV/TXT/MD”从文件中载入这些行。它接受 .csv、.txt 或 .md 文件，并会替换输入框里已有的内容。',
  'help.guide.import-packing-list.step.4': '点击右下角的“导入 3”，上面的数字是 TREK 识别出的行数。',
  'help.guide.import-packing-list.result':
    '每一行都会变成一个物品，放进它第一个字段所指定的清单中。已有的物品不会改变。',
  'help.guide.import-packing-list.tip.1':
    '逗号、分号和制表符都可以分隔字段，双引号可以把一个字段括在一起，所以“Shirt, blue”仍然是一个名称。只有一个值的行就只是名称，没有指定清单的行会归入“其他”，名称前面的 "3x" 表示数量。',
  'help.guide.import-packing-list.tip.2':
    '如果旅行中还没有第四个字段里写的那个包，TREK 会自动创建。“导入”和“应用模板”是一次为多件物品添加重量和包的两种方式。',
  // export-packing-list
  'help.guide.export-packing-list.title': '打印或导出行李清单',
  'help.guide.export-packing-list.goal': '打印清单、存为 PDF，或导出成文件，供其他应用或下次旅行使用。',
  'help.guide.export-packing-list.step.1': '点击“导出”，也就是清单上方栏中带向上箭头的图标，就在“导入”之前。',
  'help.guide.export-packing-list.step.2': '“Markdown 清单 (.md)”和“用于导入的 CSV (.csv)”会直接把清单保存为文件。',
  'help.guide.export-packing-list.step.3':
    '点击“打印或另存为 PDF”。预览会把清单排成一页：顶部是旅行、日期和已打包的进度，下面每份清单是一张卡片，每件物品都带一个勾选框。',
  'help.guide.export-packing-list.step.4':
    '点击预览下方的“打印或另存为 PDF”。浏览器会打开打印对话框：选择打印机，或选择“另存为 PDF”保存成文件。',
  'help.guide.export-packing-list.result':
    '打印件和导出文件包含当前打开的视图，即“共享”或“我的清单”，以及数量、重量和勾选状态。',
  'help.guide.export-packing-list.tip.1':
    'CSV 就是“导入”能读取的格式，行李分组也包含在内，所以你可以把它当作自己的行李模板：下次旅行时直接导入即可。',
  'help.guide.export-packing-list.tip.2':
    'Markdown 文件在 Obsidian、Notion 或 GitHub 中会显示为勾选清单，也可以通过“导入”再导回来。',
  // share-packing-item
  'help.guide.share-packing-item.title': '决定谁能看到物品、谁来带',
  'help.guide.share-packing-item.goal': '把一件物品在小组共享池、你自己的清单和你替他们带的人之间移动。',
  'help.guide.share-packing-item.step.1':
    '清单上方，“已共享”是所有人都能看到的清单，“我的清单”是你自己的，两者各自显示物品数量。点击“我的清单”查看你自己的。',
  'help.guide.share-packing-item.step.2': '回到“共享”，打开某一行末尾的三个点，点击“共享”。',
  'help.guide.share-packing-item.step.3':
    '共有三个级别：“共享”，组内所有人都能看到；“个人”，只有你自己能看到；“共享给…”，由你选择这件物品面向的人。',
  'help.guide.share-packing-item.step.4': '“个人”物品只显示在“我的清单”中，切换到“我的清单”才能找到。',
  'help.guide.share-packing-item.step.5':
    '再次打开“分享中”，在“共享给…”下勾选一个名字。这件物品也会出现在对方的清单上，这一行会多出一个小徽章，显示共享了多少人。',
  'help.guide.share-packing-item.result': '物品会归入你选的那一档，行上会显示由谁来带。',
  'help.guide.share-packing-item.tip.1':
    '只有带这件物品的人才能修改共享设置。被你共享的人会在自己的“我的清单”里看到它，旁边有一个小手徽章，鼠标悬停时会显示你的名字。他们可以勾选它。',
  'help.guide.share-packing-item.tip.2':
    '在别人负责带的共享物品上，三点菜单里显示的不是“分享中”，而是另外两项：“我也可以带”，把你加到对方旁边；“复制到我的清单”，为你生成一份私人副本。',
  'help.guide.share-packing-item.tip.3':
    '新物品沿用你添加时所在视图的分享设置。在“共享”中添加的物品会与所有人共享。在“我的清单”中添加的物品属于“个人”，除非该清单里的每件物品都与同一批人共享：这时新物品也会与他们共享。',
  // packing-bags
  'help.guide.packing-bags.title': '给行李称重',
  'help.guide.packing-bags.goal': '为每件物品填写重量，把物品分装到各个行李中，并确保每个行李都不超过航空公司的限额。',
  'help.guide.packing-bags.step.1': '点击圆圈前面的重量标记，输入物品的重量，单位为克。',
  'help.guide.packing-bags.step.2': '重量后面的圆圈表示这件物品所在的行李。点击它。',
  'help.guide.packing-bags.step.3':
    '如果还没有行李，点击“添加行李”，输入名称并按 Enter。行李创建后，物品会直接放进去。',
  'help.guide.packing-bags.step.4':
    '只要存在一个包，“行李”卡片就会出现在清单右侧。每个包显示名称、携带者、填充条、其中有多少物品及其重量。包的下方是“未分配”和“总重量”，再下面是“已打包”：已打包的重量，以及一条表示占比的细条。',
  'help.guide.packing-bags.step.5': '点击行李重量旁边的“设置限制”，按航空公司的标准以千克为单位输入限额。',
  'help.guide.packing-bags.step.6':
    '包名称行末、叉号之前的虚线加号会打开“分配成员”。勾选谁来携带这个包：他们会显示在加号旁边，卡片底部的“每人”会列出每个人携带的物品。',
  'help.guide.packing-bags.result':
    '右侧的“行李”卡片会显示每个包的重量和上限的对比、不在任何包里的物品、每个人携带的物品，以及总重量和其中已打包的部分。',
  'help.guide.packing-bags.tip.1':
    '重量输入框、行李圆圈和“行李”卡片，只有在管理员于“列表”扩展下开启了“行李追踪”时才会出现。窗口较窄时，改为从进度卡片上方的“行李”按钮打开行李。',
  'help.guide.packing-bags.tip.2':
    '行李的重量由服务器汇总所有成员的物品计算得出，包括你看不到的物品，所以这个数字就是行李的实际重量。',
  'help.guide.packing-bags.tip.3':
    '没有设置限额的行李，会和最重的行李做比较，这样各个进度条之间仍然可以对比。如果给行李设置了限额，进度条就按这个限额来衡量。',
  // create-todo
  'help.guide.create-todo.title': '添加任务',
  'help.guide.create-todo.goal': '记下一项任务，并设置清单、优先级、日期和负责人。',
  'help.guide.create-todo.step.1': '点击栏右端的“新建任务”。',
  'help.guide.create-todo.step.2':
    '“新任务”对话框打开，光标位于标题处。在“任务名称”中输入名称，想记下的其他内容写在“描述”下。',
  'help.guide.create-todo.step.3': '“列表”用来给任务分组。选一个现有的，或点击旁边的加号，在小对话框里为新列表命名。',
  'help.guide.create-todo.step.4': '“优先级”有四个按钮：“无”、P1、P2 和 P3，颜色从红到蓝。',
  'help.guide.create-todo.step.5': '“清单”旁边的“截止日期”会打开日历，“分配给”用来把任务分配给某个人。',
  'help.guide.create-todo.step.6': '点击“创建任务”。',
  'help.guide.create-todo.result':
    '任务会出现在列表中，优先级、截止日期和所属清单以徽章显示，负责人的头像在行末，同时任务会在右侧面板中打开。',
  'help.guide.create-todo.tip.1': '只有名称是必填的。其余内容都可以之后在右侧面板中补充。',
  'help.guide.create-todo.tip.2': '如果在侧栏中选了某个清单，新任务就会创建在那个清单里。',
  'help.guide.create-todo.tip.3': '在名称框里按 Enter 会直接创建任务，不会改动其他字段。',
  // todo-filters
  'help.guide.todo-filters.title': '查找并修改任务',
  'help.guide.todo-filters.goal': '只显示眼下重要的任务，然后编辑找到的那个任务。',
  'help.guide.todo-filters.step.1':
    '侧栏里的“任务”：“全部”显示所有未完成的任务，“我的任务”显示分配给你的任务，“已逾期”显示日期已过的任务，“已完成”显示完成的任务。每一项都带有数量。点击“已逾期”。',
  'help.guide.todo-filters.step.2': '“列表”下每个清单一行。选择其中一行，就只显示那个清单，已完成的任务也包括在内。',
  'help.guide.todo-filters.step.3':
    '列表顶部的排序会改变屏幕上内容的顺序：“优先级”把 P1 排在最前，“截止日期”把最近的期限排在最前。两者一次只能用一个，再点一次就回到你自己的顺序。',
  'help.guide.todo-filters.step.4': '点击任务，即可在右侧面板中打开。',
  'help.guide.todo-filters.step.5':
    '修改你需要的内容：名称、“优先级”、“列表”、“截止日期”或“分配给”。“描述”会显示文字，其中的链接可以点击，点进去即可编辑。然后点击窗格底部的“保存更改”。窗格标题栏中的方框用来把任务标为完成，“保存更改”旁边的“删除”会立即删除任务。',
  'help.guide.todo-filters.result': '列表只显示你要的任务，右侧面板用来编辑你选中的那一个。',
  'help.guide.todo-filters.tip.1':
    '列表行里只统计未完成的任务，但选中该列表后，已完成的任务也会显示。“全部”“我的任务”和“已逾期”会隐藏已完成的任务，“已完成”则只显示已完成的任务。',
  'help.guide.todo-filters.tip.2':
    '排序中的“优先级”和“截止日期”不能同时使用。只要其中一个开着，就不能再把行拖成你自己的顺序。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '预订',
  'help.ctx.trip-bookings.summary':
    '这个标签页包含旅行中除交通外的所有预订：住宿、餐位、门票、旅游团和停车。每条预订都是一张卡片、列表中的一行或时间线上的一条横条，带有预订码、文档、同行人和费用。点击预订即可打开详情。',
  'help.ctx.trip-bookings.bullet.1':
    '栏右端的“手动添加”会打开“新建预订”。可以创建六种预订：“住宿”“餐厅”“活动”“旅游团”“停车”和“其他”。航班、火车和其他交通都在“交通”标签页，不会出现在这里。',
  'help.ctx.trip-bookings.bullet.2':
    '“手动添加”前面的下载图标即“导入预订确认”，会上传确认文件，让 TREK 自动读取：EML、PDF、PKPass、HTML 或 TXT，最多五个文件，每个不超过 10 MB；如果 AI 模型能读取图片，还支持照片。只有服务器能读取这些文件时，才会显示这个图标。',
  'help.ctx.trip-bookings.bullet.3':
    '“搜索”会查找标题、类型、地点、备注、预订码和出行人。旁边的漏斗“筛选”可以按“状态”、按“类型”（每种类型带有数量），以及在有预订指定了人员之后按“出行人”缩小这个标签页的范围。漏斗上的数字表示已开启的筛选数量。',
  'help.ctx.trip-bookings.bullet.4':
    '“筛选”之后的三个图标用来切换视图：“卡片”、“列表”和“时间线”。旁边滑块形状的“视图选项”可以对卡片和列表分组、排序，或设置时间线的泳道；再往后的电子表格图标，即“导出为电子表格 (CSV)”，会把标签页当前显示的内容下载为文件。卡片默认按“已确认”和“待确认”分组，列表按日期分组。点击分区标题可以折叠该分区。',
  'help.ctx.trip-bookings.bullet.5':
    '卡片的头部按状态着色，上面有状态圆点（点击可在“待确认”和“已确认”之间切换）、类型、标题、铅笔和垃圾桶。下面是这条预订包含的详细信息：“日期”“时间”“预订码”“入住”和“退房”“地点 / 地址”“住宿”“关联到”（计划中的停靠点）“链接”“备注”“出行人”“文件”，以及关联的费用。',
  'help.ctx.trip-bookings.bullet.6':
    '点击卡片、行或条形，会打开预订的详情，底部有“在地图上”（预订有地点时）、垃圾桶和“编辑”。删除只会询问一次（“删除预订？”，如果关联的费用会一并删除，也会提示）。之后预订及其关联的支出都会被删除，如果是住宿，它的各晚也会从当天计划中移除。',
  // booking-views
  'help.guide.booking-views.title': '切换视图并打开预订',
  'help.guide.booking-views.goal': '以卡片、列表或时间线查看预订，并打开其中一条查看全部详细信息。',
  'help.guide.booking-views.step.1':
    '工具栏里“筛选”后面的三个图标是三种视图，指向它们时会显示名称：“卡片”“列表”和“时间线”。这个标签页默认以“卡片”打开，每条预订一张卡片，分在“已确认”和“待确认”两个区。点击中间的“列表”。',
  'help.guide.booking-views.step.2':
    '“列表”按天分组，每条预订占一行，右侧显示日期和时间，可以用方向键在各行之间移动。点击三个图标中的最后一个，也就是“时间线”。',
  'help.guide.booking-views.step.3':
    '“时间线”把预订铺在旅行的各天上：每种类型一条泳道，每条预订是一根从开始到结束的横条，待确认的预订是虚线边框。“行程”按宽度显示整个旅行，点击某一天的标题，即可按小时查看那一天。',
  'help.guide.booking-views.step.4':
    '“日”视图把一天铺在小时刻度上，每个条形的长度对应其时长。当天名称旁的箭头可切换到前一天和后一天。旅行进行期间，“今天”会跳到当天，右侧的“行程”和“日”开关则返回整个行程。',
  'help.guide.booking-views.step.5':
    '把鼠标悬停在一根横条上，可以看到它的日期、时间和地点，点击它即可打开这条预订的详情。“卡片”中的一张卡片和“列表”中的一行，也会打开同一个弹窗。',
  'help.guide.booking-views.step.6':
    '详情页的头部显示标题，以及状态（点击可切换）、类型、日期和预订码的标签，预订码旁有一个复制按钮。下面先是以方块显示的时间，然后是地点、出行人、备注、费用和文件（预订有这些内容时才显示），底部是“在地图上”、垃圾桶和“编辑”。',
  'help.guide.booking-views.result':
    '预订会以详情视图打开：“编辑”打开它的表单，“在地图上”在计划中显示它，“关闭”或 Esc 键会回到你之前所在的视图。',
  'help.guide.booking-views.tip.1':
    '视图图标后面的滑块图标“视图选项”，可以用“分组依据”和“排序方式”为“卡片”和“列表”分组与排序。在“时间线”中，它提供“每种类型单独一行”和“同时显示另一个标签页”，后者会把“交通”标签页的条目以淡色显示在顶部的一条细行中。“重置视图”会恢复默认设置，每个标签页都会在这个浏览器中记住自己的视图。',
  'help.guide.booking-views.tip.2':
    '旅行之前或之后的预订，以及没有日期的预订，无法显示在时间线上。它们会以小卡片的形式显示在图表下方，分在“旅行之前”“旅行之后”或“无日期”下。',
  'help.guide.booking-views.tip.3':
    '无论预订出现在哪里，打开的都是同一份详情：在“交通”标签页、日程计划、某一天的详情或某个地点的详情中都是如此。点击标题即可重命名这条预订。',
  // create-booking
  'help.guide.create-booking.title': '创建预订',
  'help.guide.create-booking.goal': '手动把餐厅、活动、旅游团、车位或其他任何内容加入旅行。',
  'help.guide.create-booking.step.1': '点击工具栏最右侧的“手动添加”。“新建预订”会打开，顶部的头部里有标题和两个标签。',
  'help.guide.create-booking.step.2':
    '点击顶部色带中的类型标签（新预订上显示“其他”），然后选择“预订类型”。这个标签页可创建六种类型：“住宿”“餐厅”“活动”“旅游团”“停车”和“其他”。表单会随你的选择而变化：只有“住宿”使用日期范围，而不是单个日期。',
  'help.guide.create-booking.step.3':
    '在顶部色带中、标签上方的字段里输入标题。这是唯一的必填项，填写之前“添加”按钮保持灰色。',
  'help.guide.create-booking.step.4':
    '设置“日期”和“开始时间”，如果预订有结束时间，再设置“结束日期”和“结束时间”。日历只提供旅行范围内的日期。不晚于开始时间的结束日期和时间会显示为红色，并且无法点击“添加”。如果只有结束时间早于开始时间而没有结束日期，则只会给出提醒：预订在次日结束时，请设置结束日期。',
  'help.guide.create-booking.step.5':
    '填入确认单上的“预订码”，然后点击头部类型旁边的状态标签。新预订显示“待确认”，点击后变为“已确认”。状态决定卡片出现在哪个区。',
  'help.guide.create-booking.step.6': '点击表单底部的“添加”。',
  'help.guide.create-booking.result':
    '预订会作为一张卡片出现在对应的区里。标题的颜色表示状态，卡片显示类型、日期、时间和预订码。旅行中的其他所有人会立即看到它。',
  'help.guide.create-booking.tip.1':
    '“地点 / 地址”会在你输入时给出真实地址。选中一个会替换你已写的内容，而你自己输入的地址会原样保留。',
  'help.guide.create-booking.tip.2':
    '在“链接”中填写这条预订在服务商网站上的页面地址。卡片和详情页会把它显示为链接，点击后在新标签页中打开。',
  'help.guide.create-booking.tip.3': '“备注”支持 Markdown，所以列表或粗体在卡片和详情视图中也会如实显示。',
  // booking-hotel
  'help.guide.booking-hotel.title': '预订住宿',
  'help.guide.booking-hotel.goal': '录入一处住宿，让它同时算作一条预订和日程中的住宿晚数。',
  'help.guide.booking-hotel.step.1': '点击“手动添加”，用头部色带里的类型标签选择“住宿”。日期字段会换成一组酒店字段。',
  'help.guide.booking-hotel.step.2':
    '在“住宿”下选择酒店。列表里是旅行的地点，不含导入的轨迹和游览路线。选中后，如果标题为空，会填入酒店名称，并把酒店地址填入“地点 / 地址”。',
  'help.guide.booking-hotel.step.3':
    '设置“从”和“到”：第一晚，以及离开的早晨。两者都会列出旅行的各天及其日期，TREK 会保证“到”晚于“从”。',
  'help.guide.booking-hotel.step.4': '填写“入住”“入住截止”和“退房”，以及确认单上的“预订码”。',
  'help.guide.booking-hotel.step.5': '点击“添加”。',
  'help.guide.booking-hotel.result':
    '卡片在“日期”下显示住宿的日期范围，以及入住和退房时间和地址。这次住宿现在也会出现在计划中对应的那几天里。',
  'help.guide.booking-hotel.tip.1':
    '“住宿”是唯一没有“日期”和“开始时间”的类型。它的日期是“从”和“到”，选择的是旅行中的天数，而不是日历日期。',
  'help.guide.booking-hotel.tip.2': '也可以不填“住宿”，直接输入地址：TREK 会查找这个地点、创建它并在地图上标出。',
  'help.guide.booking-hotel.tip.3': '删除这条预订时，它在日程计划中的住宿晚数也会一并移除。',
  // link-booking
  'help.guide.link-booking.title': '把预订关联到计划',
  'help.guide.link-booking.goal': '把预订关联到对应的停留点和地点，让它出现在你需要的位置。',
  'help.guide.link-booking.step.1': '把鼠标移到要关联的卡片上，点击头部的铅笔，“编辑预订”会打开。',
  'help.guide.link-booking.step.2':
    '打开“关联日程分配”。列表就是你的计划：每天一个标题，下面是当天的各个停靠点，带有编号和时间。选择这条预订所属的停靠点。',
  'help.guide.link-booking.step.3':
    '“地点 / 活动”用来关联地点本身。在这里选择地点后，如果标题和“地点 / 地址”还是空的，就会自动填入。',
  'help.guide.link-booking.step.4': '点击“更新”。',
  'help.guide.link-booking.result':
    '卡片会在“关联到”下显示那一天和那个停留点，这条预订也会随该停留点出现在日程计划中。',
  'help.guide.link-booking.tip.1':
    '列表顶部的“无关联（独立）”可以再次取消关联。“住宿”没有停留点选择器，它通过住宿的晚数来关联。',
  'help.guide.link-booking.tip.2':
    '选择某个有日期的日子上的停留点时，空着的“日期”会自动填好。已经设置的日期不会被改动。',
  // booking-travelers
  'help.guide.booking-travelers.title': '指定预订是为谁订的',
  'help.guide.booking-travelers.goal': '标明预订是为哪些出行人订的，然后只查看他们的预订。',
  'help.guide.booking-travelers.step.1':
    '点击卡片上的铅笔图标打开预订。“出行人”在“预订码”旁边，只要预订还没有分配任何人，它就显示“分配出行人”。',
  'help.guide.booking-travelers.step.2':
    '点击它，选出这条预订涉及的人，已命名的访客也在列表中。选中的人会打上对勾，头像也会显示在字段里。再次点击名字即可取消。',
  'help.guide.booking-travelers.step.3': '点击“更新”。',
  'help.guide.booking-travelers.step.4':
    '点击栏里的“筛选”：在“出行人”下点击某个人，就只显示他的预订。可以同时选多个人。',
  'help.guide.booking-travelers.result': '卡片会列出预订涉及的人员，“筛选”可以把这个标签页缩小到你所选人员的预订。',
  'help.guide.booking-travelers.tip.1':
    '在卡片和详情页中，出行人只是展示，不能在那里修改。要设置出行人，请在这里的表单中操作。',
  'help.guide.booking-travelers.tip.2':
    '当旅行有多位成员，并且至少有一条预订指定了某个人之后，“筛选”中才会出现“出行人”。你的选择会保留到关闭当前浏览器标签页为止。',
  // booking-files
  'help.guide.booking-files.title': '把凭证和预订放在一起',
  'help.guide.booking-files.goal': '把确认单、票或通行证附到它所属的预订上。',
  'help.guide.booking-files.step.1':
    '点击卡片上的铅笔打开这条预订。“文件”在“链接”旁边，点击其中的“附加文件”。对于已存在的预订，文档会立即上传，TREK 会显示“文件已上传”。',
  'help.guide.booking-files.step.2': '文档按名称列出，带有一个打开按钮，旁边还有一个 X。',
  'help.guide.booking-files.step.3':
    '“关联已有文件”列出这次旅行中还没有关联到这条预订的文档。选中一个，它就会被附加，无需再次上传。',
  'help.guide.booking-files.step.4': '点击“更新”。',
  'help.guide.booking-files.result':
    '卡片和详情页在“文件”下列出这些文档，点击文档即可打开。详情页列表上方的“在文件中显示”会带你到“文件”标签页。',
  'help.guide.booking-files.tip.1': '对于还在创建中的预订，文档会在你点击“添加”时上传。上传需要联网。',
  'help.guide.booking-files.tip.2': '文档旁边的 X 移除的是关联，而不是文档本身。文档仍会保留在旅行的“文件”标签页中。',
  'help.guide.booking-files.tip.3':
    '可以附加哪些类型的文件，由管理员在“允许的文件类型”中设置。默认允许文档、文本和图片。',
  // booking-cost
  'help.guide.booking-cost.title': '把预订的价格转为费用',
  'help.guide.booking-cost.goal': '把预订的费用记入“费用”，并在付款的人之间分摊。',
  'help.guide.booking-cost.step.1':
    '点击卡片上的铅笔打开这条预订，滚动到表单底部。在“费用”下可以看到“创建支出”和“关联已有支出”，旁边的说明是“先保存预订，然后打开费用编辑器”。',
  'help.guide.booking-cost.step.2': '点击“创建支出”。预订会先保存，它的表单随即关闭，费用编辑器以“添加支出”打开。',
  'help.guide.booking-cost.step.3':
    '标题栏中的名称已经是预订的标题，“日期”已经是预订的日期。填入“总金额”，并核对旁边的“货币”。',
  'help.guide.booking-cost.step.4':
    '头部的标签是“分类”，已经根据预订类型设成了对应的分类。在“谁支付的？”下选择付款人，在“分摊”下选择金额的分摊方式。',
  'help.guide.booking-cost.step.5': '点击“添加支出”。',
  'help.guide.booking-cost.result':
    '卡片底部会显示金额，这条预订的表单在“已关联支出”下列出这笔支出，同一笔支出也会出现在“费用”标签页中，并关联到这条预订。',
  'help.guide.booking-cost.tip.1':
    '分类取决于类型：“餐厅”归为“餐饮”，“住宿”归为“住宿”，“停车”归为“停车”，“活动”和“旅游团”都归为“其他”。',
  'help.guide.booking-cost.tip.2':
    '一条预订可以有多笔支出。“关联已有支出”会列出“费用”里尚未关联任何内容的支出。对于已关联的支出，“取消关联，保留支出”会解除关联并把支出留在“费用”中，而垃圾桶会直接删除它。',
  'help.guide.booking-cost.tip.3': '只有“费用”扩展处于开启状态，表单中才会有“费用”，管理员在“扩展”中切换它。',
  // filter-bookings
  'help.guide.filter-bookings.title': '查找预订',
  'help.guide.filter-bookings.goal': '按关键词、状态、类型或人员，缩小长列表的范围。',
  'help.guide.filter-bookings.step.1':
    '在工具栏的“搜索”中输入。搜索范围包括标题、类型、地点和地址、备注、预订码以及出行人的名字，输入的同时，标签页中的结果会逐步减少。按 Esc 键可清空输入框。',
  'help.guide.filter-bookings.step.2':
    '点击搜索框旁边的漏斗“筛选”。面板中有“状态”“类型”，以及在有预订指定了人员之后出现的“出行人”。',
  'help.guide.filter-bookings.step.3': '在“状态”下选择“已确认”或“待确认”，只看对应的预订；选“全部”则两者都显示。',
  'help.guide.filter-bookings.step.4':
    '在“类型”下点击一个或多个类型，只保留这些类型。每个类型旁边显示其预订数量，已选中的类型带有对勾。',
  'help.guide.filter-bookings.step.5':
    '“筛选”上的数字表示开启了多少个筛选条件，搜索框旁边的小标签表示全部预订中还剩多少条。点击这个小标签，或面板底部的“重置筛选”，即可重新显示全部内容。',
  'help.guide.filter-bookings.result':
    '这个标签页只显示你选中的内容，“卡片”“列表”和“时间线”都是如此。筛选条件会在这次旅行中一直保留，直到你关闭这个浏览器标签页。',
  'help.guide.filter-bookings.tip.1':
    '只有当标签页里的预订类型多于一种时，才会显示“类型”，而且只列出标签页里已有的类型。所以如果没有旅游团预订，“类型”里就没有“旅游团”这个选项。',
  'help.guide.filter-bookings.tip.2':
    '如果没有任何内容符合筛选条件，标签页会显示“没有符合这些筛选条件的内容”，正下方是“重置筛选”。',
  // import-booking-file
  'help.guide.import-booking-file.title': '从确认单导入预订',
  'help.guide.import-booking-file.goal': '让 TREK 从服务商发来的邮件或 PDF 中读取预订信息，省得你再手动输入。',
  'help.guide.import-booking-file.step.1':
    '点击工具栏里的下载图标“导入预订确认”，指向它时会显示名称。同名的对话框随即打开。',
  'help.guide.import-booking-file.step.2':
    '把确认文件拖到框内，或点击后选择文件：支持 EML、PDF、PKPass、HTML 和 TXT，最多五个文件，每个不超过 10 MB；如果 AI 模型能读取图片，还支持照片（JPG、PNG、WEBP）。你选好的文件会显示在框内。',
  'help.guide.import-booking-file.step.3': '点击“导入”。对话框会立即关闭，因为读取在后台进行。',
  'help.guide.import-booking-file.step.4':
    '右下角的一张卡片在文件名下显示进度。你在应用里切换页面或刷新后，它仍然保留。读取完成后，“正在解析文件…”会变成对勾，卡片上出现“导入”。点击它。',
  'help.guide.import-booking-file.step.5':
    '找到的每条预订都会依次在“新建预订”中打开，内容已经填好。以酒店为例：名称作为标题；如果旅行中有这个地点，还会填入“住宿”下的地点，以及“地点 / 地址”、对应住宿晚数的“从”和“到”、“入住”和“退房”、“预订码”、“文件”下的确认单，在开启“费用”时还会把价格填为“关联支出”。检查无误后点击“添加”。',
  'help.guide.import-booking-file.result':
    '这条预订会作为一张卡片出现在“待确认”中，显示住宿晚数、预订码，确认单在“文件”下。住宿会出现在计划中对应的那几天里。如果开启了“费用”，价格会作为一笔关联到该预订的支出添加进去。',
  'help.guide.import-booking-file.tip.1':
    '只有服务器能够读取预订确认单时，才会显示导入图标。这需要提取器或“AI 解析”扩展二者之一，“AI 解析”扩展由管理员在“扩展”中开启。没有预订的标签页也会以“从文件导入”按钮的形式提供这个功能。',
  'help.guide.import-booking-file.tip.2':
    '如果什么都没读出来，卡片会告诉你。开启“AI 解析”后，卡片会提供“尝试 AI 解析”，它会把同样的文件直接发给模型。解析完成的结果会保留十分钟，请在这段时间内开始核对。',
  'help.guide.import-booking-file.tip.3':
    '只有确认单的类型在管理员设置的“允许的文件类型”中时，才会附上它。默认允许 PDF；邮件（EML）需要先添加，否则预订保存时不会带上它。',
  // edit-booking
  'help.guide.edit-booking.title': '修改预订',
  'help.guide.edit-booking.goal': '更正时间、补上稍后才收到的预订码，或把预订从“待确认”改为“已确认”。',
  'help.guide.edit-booking.step.1':
    '把鼠标移到卡片上，点击头部的铅笔。“编辑预订”会打开，并带有这条预订的全部详细信息。',
  'help.guide.edit-booking.step.2': '修改需要更改的内容，例如运营商后来才发来的“预订码”。',
  'help.guide.edit-booking.step.3': '点击顶部色带中的“待确认”标签，它会变成“已确认”，色带也会变成绿色。',
  'help.guide.edit-booking.step.4': '点击“更新”。',
  'help.guide.edit-booking.result':
    '卡片会移动位置：已确认的预订会出现在“已确认”区，带有绿点和绿色的顶部色带，旅行中的每个人都能看到它的变化。',
  'help.guide.edit-booking.tip.1':
    '如果看不清“预订码”，是因为在“设置”的“显示”下开启了“隐藏预订编号”。把鼠标悬停在预订码上，或点击它，就能看清。',
  'help.guide.edit-booking.tip.2': '如果你修改了类型，关联支出的分类也会随之变化，除非你曾在费用编辑器里手动选过分类。',
  'help.guide.edit-booking.tip.3':
    '预订详情页底部的“编辑”会打开同一个表单。状态也可以不打开表单直接切换：点击卡片或列表行上的圆点，或者详情页中的状态标签。',
  // delete-booking
  'help.guide.delete-booking.title': '删除预订',
  'help.guide.delete-booking.goal': '把已取消的预订从旅行中移除。',
  'help.guide.delete-booking.step.1': '指向卡片，点击头部的垃圾桶图标。预订详情底部的垃圾桶作用相同。',
  'help.guide.delete-booking.step.2':
    '“删除预订？”会写明你选中的那一条，并说明它将被永久删除。如果有费用与之关联，还会说明这些费用也会一并删除。',
  'help.guide.delete-booking.step.3': '点击“删除”。',
  'help.guide.delete-booking.result':
    '卡片会对旅行中的所有人一起删除。删除预订无法撤销，所以确认提示是你最后一次取消的机会。',
  'help.guide.delete-booking.tip.1':
    '删除预订时，关联到它的支出也会一起删除。删除住宿时，它在日程计划中的住宿晚数也会一并移除。',
  'help.guide.delete-booking.tip.2': '已附加的文档仍保留在这次旅行的“文件”标签页中，只会移除它们与这条预订的关联。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '费用',
  'help.ctx.trip-costs.summary':
    '旅行的账目：每笔支出按日期记在账本或表格里，包括是谁录入的、谁要分摊，并按收据上的货币显示。右栏显示谁需要付钱给谁，才能结清账目。',
  'help.ctx.trip-costs.bullet.1':
    '顶部栏显示旅行的日期和分摊费用的同行者，还包含“搜索支出…”、“筛选”（漏斗图标）、“导出 CSV”（下载图标）以及“列表”/“表格”切换。',
  'help.ctx.trip-costs.bullet.2':
    '在它的右端，“结算”会一次记录所有未完成的转账，“扫描收据”会在“AI 解析”扩展能读取图片时，根据照片填好一笔支出，“添加支出”则打开编辑器。',
  'help.ctx.trip-costs.bullet.3':
    '工具栏下方有四张卡片：“你欠款”和“别人欠你”是你自己的结算情况，“未结算金额”是已记录但还没有付款人的部分，“行程总支出”汇总全部，下面是“你的份额”和“你已支付”。',
  'help.ctx.trip-costs.bullet.4':
    '账本按日期分组，最新的在前，每一天的标题显示它包含多少条记录和花了多少钱。每一行有以彩色标签显示的分类、名称、带有各自支付金额的付款人标签，下面是“分摊”，列出每位出行人的份额（勾号表示谁已付清自己的份额），再往后是备注和金额。如果分摊的结果是别人欠你钱或你欠别人钱，还会显示“你借出”或“你借入”。',
  'help.ctx.trip-costs.bullet.5':
    '右侧一栏显示结果：“结算”列出谁该付给谁，“余额”显示每位出行人的盈余或欠款，“最终花费”显示这次旅行每个人各花了多少，“按分类”显示钱花在了哪些方面。',
  'help.ctx.trip-costs.bullet.6':
    '已记录的付款会作为单独一行出现在同一账本中，旁边有铅笔图标和“撤销”。支出有铅笔和垃圾桶图标，点垃圾桶会先确认再删除。带收据的支出，名称旁边有“收据”标签，点击即可打开。',
  'help.ctx.trip-costs.bullet.7':
    '工具栏中的“表格”会把同样的支出显示为一张表，按分类分组，带有“人数”和“天数”，以及人均和每天的金额，此时“汇总”会取代“按分类”。“费用”会记住你选择的视图。',
  // add-expense
  'help.guide.add-expense.title': '添加支出',
  'help.guide.add-expense.goal': '记录某样东西花了多少钱、谁付的款、又和谁分摊。',
  'help.guide.add-expense.step.1':
    '点击栏右端的“添加支出”。编辑器会打开，日期是今天，付款人是你，所有人已在分摊名单中。',
  'help.guide.add-expense.step.2':
    '在对话框顶部的输入框里写下这笔钱花在了什么上，输入框为空时会显示“例如：晚餐、纪念品、油费…”。这是支出的名称，没有名称就无法保存。',
  'help.guide.add-expense.step.3':
    '名称下方的标签是“分类”，在你另选之前是“餐饮”。共有十四种，不能更改。头部会变成你所选分类的颜色，行上的标签和“按分类”中的对应柱条也一样。',
  'help.guide.add-expense.step.4':
    '在“总金额”中填入收据上的金额。旁边的“货币”默认是“费用”当前显示所用的货币；如果你改了货币，编辑器会显示换算后的金额。“日期”默认是今天，这笔支出会按这一天归入列表。',
  'help.guide.add-expense.step.5':
    '在“谁支付的？”下，点击实际付钱的人。默认已选中“你”。选择“尚无人支付”只会记录金额，不会让任何人为此欠钱；标题旁边开关中的“多人支付”可以把账单分给多个付款人。',
  'help.guide.add-expense.step.6':
    '下方的“分摊”默认是“平均分摊”，所有人都已勾选，每个名字旁边显示各自的份额。可以保持不变，也可以修改。点击对话框底部的“添加支出”保存。',
  'help.guide.add-expense.result':
    '这笔支出会记入账本中对应日期下，并计入“行程总支出”，结算栏也会重新计算谁该付钱给谁。',
  'help.guide.add-expense.tip.1':
    '如果不修改默认值，这笔支出的日期是今天，由你付款，并在所有人之间平均分摊：只需填写名称和金额。',
  'help.guide.add-expense.tip.2': '金额旁边的 ± 可以把支出变成退款。总额为负表示退钱，分摊方向也会反过来。',
  'help.guide.add-expense.tip.3':
    '对话框底部“收据与发票”旁的“附加”接受图片和 PDF。它们会在你保存时上传，存放在旅行的“文件”中，列表里名称旁会出现“收据”标签。',
  // expense-payers
  'help.guide.expense-payers.title': '设置谁付了款',
  'help.guide.expense-payers.goal': '记录这笔支出是谁付的钱。这是结算计算的另一半依据。',
  'help.guide.expense-payers.step.1':
    '点击支出行旁边的铅笔图标打开支出，查看“谁支付的？”。标题旁边的开关默认是“一人支付”：每位出行人是一个标签，带边框的那个就是付款人。点击另一个标签即可更改。',
  'help.guide.expense-payers.step.2':
    '出行人后面的虚线标签“尚无人支付”只记录金额，不会让任何人欠钱。这笔支出仍然计入“行程总支出”。',
  'help.guide.expense-payers.step.3':
    '切换开关的另一个选项“多人支付”，会列出每位同行者并配一个复选框，勾选的人会出现一个金额输入框。勾选付过款的人，并填写各自付了多少，金额之和必须等于总额。',
  'help.guide.expense-payers.step.4':
    '没有人付款的支出会在行上标记“未完成”，并计入“未结算金额”卡片，那里汇总了还没有付款人的支出。',
  'help.guide.expense-payers.result': '谁付款决定谁收到还款，分摊决定谁要付钱，“余额”就是两者之间的差额。',
  'help.guide.expense-payers.tip.1':
    '“谁支付的？”和“分摊”互不影响：你可以替一顿自己没去的晚餐付款，也可以被分摊到一顿自己没付款的晚餐里。',
  'help.guide.expense-payers.tip.2':
    '有多个付款人时，各自的金额之和必须等于总额。每多勾选一个付款人，剩余金额就会在你没有亲自填写的那些金额之间重新分摊。金额之和不一致时，编辑器会显示需要凑到的总额，并且不会保存。',
  'help.guide.expense-payers.tip.3':
    '把支出改回“尚无人支付”并不会删除它：金额仍计入“行程总支出”，这一行则会变为“未完成”。',
  // split-expense
  'help.guide.split-expense.title': '在出行人之间分摊账单',
  'help.guide.split-expense.goal': '决定一笔支出由谁分摊：所有人平均分摊、按金额分摊，或按收据逐项分摊。',
  'help.guide.split-expense.step.1':
    '在支出编辑器中，“分摊”列出每位同行者，每人带一个复选框。取消勾选某个名字，就把这个人排除在这笔支出之外：名字会变灰，没有份额，也不需要为这笔支出付钱。',
  'help.guide.split-expense.step.2':
    '标题旁边切换开关里的“平均分摊”是默认选项：每位已勾选的同行者分到相同的份额，显示在名字旁边。列表下方的徽章显示有多少人分摊，以及每份是多少。',
  'help.guide.split-expense.step.3':
    '“自定义金额”会把份额换成金额输入框。输入每位同行者应承担的金额。下方的徽章会随着输入实时更新，达到“分摊金额与总额相符”时变成绿色。金额与总额不一致时无法保存。',
  'help.guide.split-expense.step.4':
    '“按账单明细”会把收据逐行拆开：点击“添加项目”，每行填写名称和价格，并在“分摊：”旁选出分担这一行的出行人。',
  'help.guide.split-expense.step.5':
    '明细下方的“每人份额”显示每位出行人最终应承担的金额，顶部的“总金额”是各行明细之和。点击对话框底部的“保存”。',
  'help.guide.split-expense.result':
    '所有余额都根据分摊来计算。分摊随支出一起保存，在支出所在行显示为“分摊”，并列出每位出行人的份额，之后可以修改，不会影响其他任何内容。',
  'help.guide.split-expense.tip.1': '取消勾选的出行人，只在这一笔支出上不用承担费用，其他人则各自承担自己的份额。',
  'help.guide.split-expense.tip.2':
    '“平均分摊”会精确到分：多出来的一分每笔支出都落在不同的人身上，不会总由同一个人出。',
  'help.guide.split-expense.tip.3': '“按账单明细”模式会自己计算“总金额”并将该字段置灰：总额就是收据各行的合计。',
  'help.guide.split-expense.tip.4':
    '自定义分摊也可以按百分比输入：把“份额输入方式”切换为 %，各份额合计必须正好是 100%，支出才能保存。',
  // expense-currency
  'help.guide.expense-currency.title': '用另一种货币录入支出',
  'help.guide.expense-currency.goal': '按收据上的货币填写金额，汇率由 TREK 帮你保存。',
  'help.guide.expense-currency.step.1':
    '打开“添加支出”。在对话框顶部输入名称，并在“总金额”中按收据上的原样填写金额，不要填换算后的金额。',
  'help.guide.expense-currency.step.2':
    '打开金额旁边的“货币”，选择收据上的货币。列表包含 TREK 支持的所有货币代码，并且可以搜索：输入三个字母即可。',
  'help.guide.expense-currency.step.3':
    '字段下方会出现一排徽章：你输入的金额及其当前价值，标有“实时汇率”。这只是预览，不是最终保存的数值。',
  'help.guide.expense-currency.step.4': '点击对话框底部的“添加支出”。汇率会在此刻固定：这笔支出保留你录入当天的价值。',
  'help.guide.expense-currency.step.5':
    '在账本中，这一行在名称下方显示两个金额：你输入的金额、一个箭头，以及折算成旅行货币后的金额。“费用”标签页上的所有合计、余额和结算都以第二个金额为准。',
  'help.guide.expense-currency.result':
    '支出会保留你输入的金额和货币。账本中两者都会显示，而旅行的合计和余额则按旅行的货币计算。',
  'help.guide.expense-currency.tip.1':
    '汇率在你保存时就固定下来，所以已结清的欠款不会因为下一周汇率变动而改变。只有修改这笔支出的货币时，才会保存新的汇率。',
  'help.guide.expense-currency.tip.2':
    '“设置”中的“显示货币”只改变金额的显示方式，已保存的金额不会改变。如果留空，每个旅行都按它自己的货币显示。',
  'help.guide.expense-currency.tip.3':
    '行程货币在旅行本身中设置，位于“编辑旅行”下，需要“编辑旅行详情”权限。更改后，所有已固定的汇率都会按新货币重新计算，而金额本身不会被换算。',
  // filter-costs
  'help.guide.filter-costs.title': '查找一笔支出或某一天的开销',
  'help.guide.filter-costs.goal': '从一长串支出中筛选出你要找的那些。',
  'help.guide.filter-costs.step.1': '在栏里的“搜索支出…”中输入。它会在你输入时匹配支出的名称，按 Esc 键则清空。',
  'help.guide.filter-costs.step.2':
    '搜索框旁边的漏斗“筛选”用来打开各项筛选。顶部的切换开关是你查看账本的角度：“全部”；“我支付的”，即你付款的支出；“别人欠我”，即你付的比自己份额多的支出。',
  'help.guide.filter-costs.step.3':
    '在“分类”下选择十四个分类中的一个，就只显示该分类的支出。漏斗图标会显示当前开启了几项筛选。',
  'help.guide.filter-costs.step.4':
    '在“日期”下选择一个有支出的日子。日期标题会被一条横幅取代，显示那一天的完整日期、当天的支出笔数和合计。',
  'help.guide.filter-costs.step.5':
    '漏斗旁边的下载图标“导出 CSV”会把所有支出保存到文件中，包含原始金额、货币和换算后的金额。',
  'help.guide.filter-costs.result': '筛选条件可以叠加，按日期分组的合计也会按剩下的支出重新计算。',
  'help.guide.filter-costs.tip.1':
    '已记录的付款没有名称和分类，所以搜索或分类筛选会把它们隐藏，“别人欠我”也一样。日期筛选则会保留它们，归在付款发生的那一天下。',
  'help.guide.filter-costs.tip.2': '无论屏幕上筛选了什么，“导出 CSV”始终导出全部支出，每笔支出一行。',
  'help.guide.filter-costs.tip.3': '只要开启了任何筛选，筛选菜单底部就会出现“重置筛选”，点击它可以一次关闭所有筛选。',
  // settle-up
  'help.guide.settle-up.title': '查看谁欠谁，并结清欠款',
  'help.guide.settle-up.goal': '把众多共同支出合并成让所有人结清欠款所需的最少几笔转账，并在转账完成时记录下来。',
  'help.guide.settle-up.step.1':
    '右侧一栏的“结算”卡片列出了能结清所有欠款的转账：谁付给谁（显示为两个头像，名字在悬停提示中），以及金额。卡片头部的数字表示还有几笔未结清。',
  'help.guide.settle-up.step.2': '点击转账旁边的“结算”，会将其记为已完成。这笔转账会从卡片中消失，余额也会随之更新。',
  'help.guide.settle-up.step.3':
    '记录下来的转账会作为账本中的一行，归在发生当天下，标有“付款”，并显示两位同行者和金额。',
  'help.guide.settle-up.step.4': '在这一行旁边，铅笔用来更正付款，“撤销”用来取消付款，该笔转账会回到“结算”卡片。',
  'help.guide.settle-up.step.5':
    '卡片标题栏中的“添加付款”用来记录一笔没有按建议进行的转账。选择“付款方”和“到”、金额、币种和发生的日期，需要的话在“备注”里写上付款方式等说明，然后点击对话框底部的“添加付款”。',
  'help.guide.settle-up.step.6':
    '顶部栏里的“结算”会不经询问，一次记录所有未完成的转账，比如大家在旅行结束时一起结清所有欠款。',
  'help.guide.settle-up.result':
    '每一笔记录的转账都会成为账本中的一行，同时让“结算”卡片少一条记录。卡片显示“大家已两清”时，这次旅行就结清了。',
  'help.guide.settle-up.tip.1':
    '卡片显示的是最少的转账笔数，而不是每一笔欠款：如果三个人互相欠成一个圈，会被简化为一两笔付款。',
  'help.guide.settle-up.tip.2': '“结算”只是记录一笔转账，并不会真的转账。请先用你习惯的方式付款，再点击“结算”。',
  'help.guide.settle-up.tip.3':
    '付款可以使用任何货币，所以用欧元偿还日元的欠款是正常的：对话框有自己的货币选择器，并且同样会固定当时的汇率。',
  // final-budget
  'help.guide.final-budget.title': '查看每位同行者在旅行中花了多少',
  'help.guide.final-budget.goal': '查看每个人的数据：当前的余额，以及每人真正的花费。',
  'help.guide.final-budget.step.1':
    '“余额”显示每位同行者的情况：如果旅行欠他，就是向右的绿色条；如果他欠旅行，就是向左的红色条，金额显示在名字旁边。',
  'help.guide.final-budget.step.2':
    '下方的“最终花费”回答的是另一个问题：不是现在谁欠谁多少，而是所有款项还清之后，这次旅行让每位同行者实际花了多少。',
  'help.guide.final-budget.step.3': '点击一个名字查看计算过程：先是“已支付的支出”，下面是“还款净额”和“待还款项”。',
  'help.guide.final-budget.step.4':
    '在这三行下方，每位出行人的名字下都有一个列表，列出构成这一行的明细：该出行人支付的支出、已记录的转账和尚未完成的转账。每个列表加起来恰好等于同名的那一行。',
  'help.guide.final-budget.result':
    '“余额”显示截至今天谁该收钱、谁该付钱。“最终花费”显示所有款项还清之后，这次旅行最终让你们每个人花了多少。',
  'help.guide.final-budget.tip.1': '记录一笔付款不会改变任何人的最终预算，只是把一笔金额从待报销转为净报销。',
  'help.guide.final-budget.tip.2': '没有付款人的支出不会计入这两张卡片，就像它不会出现在结算建议里一样。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '把预订转为支出',
  'help.guide.expense-from-booking.goal': '把航班、酒店或地点的实际花费，附到它所属的记录上。',
  'help.guide.expense-from-booking.step.1': '在“交通”或“预订”标签页中找到该预订，点击卡片顶部的铅笔图标。',
  'help.guide.expense-from-booking.step.2':
    '滚动到表单末尾附近的“费用”。这里有“创建支出”，它会先保存预订；还有“关联已有支出”，用于关联已经在“费用”中的支出。',
  'help.guide.expense-from-booking.step.3':
    '点击“创建支出”。预订会被保存，表单关闭，费用编辑器随即打开：预订的标题作为名称，预订类型对应到某个分类，预订的日期作为支出的日期。',
  'help.guide.expense-from-booking.step.4':
    '像填写其他支出一样，填写金额和币种、付款人和分摊方式，然后点击“添加支出”。再次打开该预订时，这笔支出会显示在“已关联支出”下，旁边有铅笔图标用于编辑，“取消关联，保留支出”用于解除关联但保留支出，垃圾桶用于删除。',
  'help.guide.expense-from-booking.result':
    '预订会显示它的费用，这笔支出在“费用”标签页中就是一条普通的行，和其他支出一样有付款人、分摊方式和货币。',
  'help.guide.expense-from-booking.tip.1':
    '删除预订会连同其关联的支出一起删除，确认提示里会说明这一点。预订“费用”区块中的“移除关联支出”则相反：删除支出，保留预订。“取消关联，保留支出”则两者都保留。',
  'help.guide.expense-from-booking.tip.2': '地点的表单里也有同样的区块，其中的“创建支出”会先保存地点。',
  // costs-table
  'help.guide.costs-table.title': '用表格规划费用',
  'help.guide.costs-table.goal': '以表格形式查看和修改支出，按分类排列，并按每人和每天计算。',
  'help.guide.costs-table.step.1':
    '点击栏里“列表”/“表格”切换的第二个图标“表格”。包含相同支出的表格会取代账本，搜索和筛选同样适用于它。',
  'help.guide.costs-table.step.2':
    '表格按分类分组。每组的标题显示名称、支出数量和小计，点击标题可折叠该组。各列依次是“名称”“日期”“合计”“人数”和“天”，然后是“人均”“日均”和“人日均”，这三列由前面的数据算出，显示在灰色底上。底部的“合计”行把所有内容加总。',
  'help.guide.costs-table.step.3':
    '点击单元格即可直接修改：名称、合计、“人数”或“天数”。输入后按 Enter 键或点击其他位置即可保存，按 Esc 键则取消；点击日期会打开日历。“人均”和其他计算列会立即更新。',
  'help.guide.costs-table.step.4':
    '带锁的合计不能在这里修改：要么已经有人支付，要么是用另一种货币录入的，悬停提示会说明是哪种情况。点击它会改为打开这笔支出，这样余额和固定的汇率才能保持正确。',
  'help.guide.costs-table.step.5':
    '分类末尾的“添加支出”会在该分类中添加一行名为“新建条目”的记录，日期与该分类中最新条目的日期相同，名称处于可编辑状态。合计也用同样的方式填写。',
  'help.guide.costs-table.step.6':
    '在这个视图中，右栏显示的是“汇总”，而不是“按分类”。它从四个角度汇总支出：“分类”“日期”“付款人”（未付款的归入“尚无付款人”），以及“状态”（“已支付”对比“未支付”）。',
  'help.guide.costs-table.result':
    '每笔支出都显示在所属分类下，附带每人和每天的金额。在单元格里修改合计后，上方的卡片和“汇总”会立即更新。',
  'help.guide.costs-table.tip.1': '“费用”会在这个浏览器中记住视图：它会一直以表格打开，直到你再次点击“列表”。',
  'help.guide.costs-table.tip.2':
    '按“自定义金额”或“按账单明细”分摊的支出没有统一的人均份额，所以它的“人均”和“人日均”保持为空。',
  'help.guide.costs-table.tip.3':
    '付款人、分摊、备注和收据需要在支出详情中编辑：行末的“更多选项”里有“编辑”，以及用来删除这一行的“删除”。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '交通',
  'help.ctx.trip-transports.summary':
    '你在各个站点之间使用的所有交通方式：航班、火车、公交、汽车、出租车、自行车、邮轮、渡轮、缆车，以及 TREK 为你查询的公共交通换乘方案。该标签页以列表形式显示它们；你也可以在计划中创建和查看它们，它们还会画在地图上。',
  'help.ctx.trip-transports.bullet.1':
    '此标签页只显示交通。住宿、餐厅、活动和票券在“预订”标签页中，这样同一条目不会出现两次。',
  'help.ctx.trip-transports.bullet.2':
    '顶部栏有“搜索”、用于筛选状态、类型和出行人的“筛选”、“卡片”“列表”和“时间线”三种视图、“视图选项”，以及下载当前所见内容的“导出为电子表格 (CSV)”。右侧的“交通”用来手动添加一段行程。它前面的“导入预订确认”和“从 AirTrail 导入”图标，在服务器能读取确认文件或已连接 AirTrail 时才会出现。标签页为空时，同样的操作会显示在中间，分别是“交通”“从文件导入”和 AirTrail。',
  'help.ctx.trip-transports.bullet.3':
    '“卡片”是打开这个标签页时的默认视图：先是“已确认”，然后是“待确认”，点击各区标题可以折叠。规划好的公共交通换乘没有状态，会按时间顺序排在已确认的行程之间，除非你在“视图选项”里为它们单独设一个区，叫“自动公共交通”。“列表”按天分组，“时间线”把每段行程铺在旅行的各天上。',
  'help.ctx.trip-transports.bullet.4':
    '卡片顶部的色带按状态着色：已确认为绿色，待确认为琥珀色，规划好的换乘为蓝色。色带上有状态圆点、类型、标题、铅笔和垃圾桶。下面是“日期”“时间”“预订码”“路线”，以及航空公司和航班号，或车次、站台和座位。点击卡片即可打开详情。',
  'help.ctx.trip-transports.bullet.5':
    '也可以直接在计划中创建交通：点击当天标题栏中的 +（提示为“添加到当天”），或右键点击标题栏，会看到“添加交通”和“公共交通”。两个站点之间的行程时间连接线，则会针对这一段打开同样的搜索。',
  'help.ctx.trip-transports.bullet.6':
    '两端都已设置的交通会在地图上画出一条线。日程里该交通那一行上的路线图标，以及它详情中的“在地图上”，都可以打开这条线。天数上方工具栏里的“显示所有预订路线”则一次打开或关闭整个旅行的线路。',
  // transports-list
  'help.guide.transports-list.title': '看懂“交通”标签页',
  'help.guide.transports-list.goal': '在修改之前，先弄清楚这个列表显示的是什么。',
  'help.guide.transports-list.step.1':
    '“交通”是旅行的一个标签页，位于“计划”之后（启用“游览”扩展时在“游览”之后）。它只包含交通，酒店、餐厅、活动和票券在“预订”标签页。',
  'help.guide.transports-list.step.2':
    '栏左侧的“搜索”会在你输入时筛选交通。旁边漏斗形的“筛选”打开选项：“状态”有“全部”“已确认”和“待确认”，然后是正在使用的每种类型及其数量。勾选一种或几种类型，只显示这些。漏斗上的数字表示已启用的筛选数，栏中会显示当前显示的条数，例如“4 条中的 1 条”。菜单底部的“重置筛选”会重新显示所有交通。',
  'help.guide.transports-list.step.3':
    '旁边的“卡片”“列表”和“时间线”分别把交通显示为卡片、按天分组的行，或贯穿旅行各天的横条。滑块图标“视图选项”可以为“卡片”和“列表”设置“分组依据”和“排序方式”，为“时间线”设置分行方式；“重置视图”会恢复默认设置。在“卡片”视图中，开启“公共交通单独成区”后，规划好的线路会显示在“自动公共交通”下。',
  'help.guide.transports-list.step.4':
    '每张卡片都显示全部详细信息。顶部色带在“已确认”时为绿色，“待确认”时为琥珀色，上面有状态圆点、类型和标题。下面的“日期”显示它跨越的日子和具体日期，接着是“时间”“预订码”、在各站之间带有类型图标的“路线”，以及航空公司和航班号，或者车次、站台和座位。点击卡片即可打开详情。',
  'help.guide.transports-list.step.5':
    '点击状态圆点，可以在“待确认”和“已确认”之间切换，悬停提示会说明切换方向，例如“设为待确认”。标题栏中的铅笔图标打开交通表单，垃圾桶在你回答“删除预订？”后将其删除，该提示会列出将被删除的内容，包括关联的费用。',
  'help.guide.transports-list.result': '每张卡片都会显示这趟行程是否已订好，你也可以随时用工具栏来筛选或排序列表。',
  'help.guide.transports-list.tip.1':
    '这个标签页会记住你的设置：视图、分组和排序记在当前浏览器里，各次旅行折叠的区块也会分别记住，筛选条件则保留到你关闭这个浏览器标签页为止。',
  'help.guide.transports-list.tip.2':
    '“交通”前面的两个图标“导入预订确认”和“从 AirTrail 导入”，分别只在服务器能读取确认单、以及已连接 AirTrail 实例时才会出现。没有它们时，你需要手动填写，或使用公共交通搜索来填充列表。',
  // add-transport
  'help.guide.add-transport.title': '给某一天添加交通',
  'help.guide.add-transport.goal': '把从一个停靠点到下一个停靠点的交通，添加到它发生的那一天。',
  'help.guide.add-transport.step.1':
    '在乘车那天的标题中，点击 +（提示为“添加到当天”），选择“添加交通”。右键点击当天的标题也有同样的菜单。表单打开时已经填好了那一天。',
  'help.guide.add-transport.step.2':
    '标题栏中的类型标签显示交通类型，默认是“飞行”。点击它可以选择“飞行”“火车”“公交”“汽车”“出租车”“自行车”“邮轮”“渡轮”“缆车”或“其他”，表单会随之变化：飞行的每个经停点都有机场，火车是一串车站，邮轮有“登船”“停靠港”和“下船”，汽车有“取车”和“还车”以及“沿途停靠点”。',
  'help.guide.add-transport.step.3':
    '直接在顶部色带里灰色示例文字的位置输入标题。这是唯一的必填项：填写之前，下方那行会显示“标题 *”，“添加”按钮保持灰色。请用在出发信息牌上一眼就能认出来的名称。',
  'help.guide.add-transport.step.4':
    '在“路线”下，“出发”和“到达”可以填写车站、港口或地址。输入之前会先列出这个旅行自己的地点。至少输入三个字母才会开始搜索，然后选择一个结果。只是手动输入、没有从结果中选择的名称不会被保存，地图上也不会显示任何内容。',
  'help.guide.add-transport.step.5':
    '“日期”和“开始时间”表示出发时间，“结束日期”和“结束时间”表示到达时间；如果次日才到，就在那里填次日日期。下方的“预订码”和“备注”为选填。点击头部的“待确认”标签，可以把它改为“已确认”。',
  'help.guide.add-transport.step.6': '点击“添加”。',
  'help.guide.add-transport.result':
    '这段交通会成为当天的一行，按它的时间排在各停留点之间，同时在“交通”标签页的“待确认”或“已确认”下显示为一张卡片。',
  'help.guide.add-transport.tip.1':
    '这一行按开始时间排列，位于最后一个开始得更早的停留点之后。拖动它的手柄，可以把它移到当天的其他位置，或拖到另一天。',
  'help.guide.add-transport.tip.2':
    '用“文件”下的“附加文件”添加车票。“费用”下的“创建支出”会保存这条预订，并打开“费用”编辑器来填写票价。',
  'help.guide.add-transport.tip.3':
    '表单的第一块“出行人”用来指定谁乘坐这段交通。当旅行有多位成员，并且有交通指定了某个人之后，这个标签页的“筛选”里也会出现“出行人”，可以只看某一个人的交通。',
  // import-transport-file
  'help.guide.import-transport-file.title': '从电子票导入航班',
  'help.guide.import-transport-file.goal': '让 TREK 从承运方发来的票据中读取航班、火车或渡轮信息，保存前再由你核对。',
  'help.guide.import-transport-file.step.1':
    '在“交通”标签页的工具栏中，点击“交通”前面的下载图标，其提示文字是“导入预订确认”。同名对话框随即打开，与“预订”标签页中的相同。标签页为空时，中间的“从文件导入”作用一样。',
  'help.guide.import-transport-file.step.2':
    '把票据拖到框上，或点击框后选文件：支持 EML、PDF、PKPass、HTML 和 TXT，最多五个文件，每个不超过 10 MB；如果你的服务器有可读取照片的 AI 模型，还支持票据照片（JPG、PNG、WEBP）。框里会显示你所选文件的名称。',
  'help.guide.import-transport-file.step.3': '点击“导入”。对话框会立即关闭，文件在后台读取。',
  'help.guide.import-transport-file.step.4':
    '右下角的一张卡片在文件名下显示进度。读取完成后，“正在解析文件…”会变成对勾，卡片上出现“导入”。点击它。',
  'help.guide.import-transport-file.step.5':
    '航班会在“添加交通”中打开，内容已经填好：类型标签是“飞行”，航空公司和航班号作为标题显示在头部，“路线”下是两个机场，带有“出发”和“到达”、各自的时间和时区，还有“航空公司”和“航班号”、“预订码”，以及“文件”下的票据。检查无误后，点击“添加”。',
  'help.guide.import-transport-file.result':
    '这趟航班会作为“待确认”下的一张卡片出现在“交通”标签页，同时也是出发当天的一行，车票在“文件”下。如果两个机场都已知，航班会在地图上显示为一条弧线。',
  'help.guide.import-transport-file.tip.1':
    '两个标签页使用的是同一个导入功能。同时包含航班和酒店的文件，会先在“添加交通”中打开航班，再在“新建预订”中打开酒店，与你从哪个标签页开始无关。',
  'help.guide.import-transport-file.tip.2':
    '机场按代码定位。如果某个车站或港口无法定位，它的名称会以琥珀色显示在右下角的导入卡片上。请在点击“添加”之前，先在“路线”下手动选好，否则这段交通不会显示在地图上。',
  // plan-transit
  'help.guide.plan-transit.title': '规划公共交通换乘',
  'help.guide.plan-transit.goal': '让 TREK 查出某一天两个地点之间真实的火车和公交，并把你选中的那一趟放进计划。',
  'help.guide.plan-transit.step.1':
    '点击这一天标题里的 +，选择“公共交通”。搜索会针对这一天打开：这一天以标签形式显示在标题中，旁边的“手动”和“自动”用来在这个搜索和常规表单之间切换。',
  'help.guide.plan-transit.step.2':
    '“从”和“到”可以填站点或车站。输入框还是空的时候，TREK 会推荐当天的住宿、当天预订的车站和机场，以及当天自己的站点；输入两个字母后，则改为搜索时刻表中的车站。两个输入框之间的“交换”可以对调“从”和“到”。',
  'help.guide.plan-transit.step.3':
    '“出发”或“到达”加上时间，表示你想什么时候出行；“最佳路线”“减少换乘”或“减少步行”决定结果的排序方式。',
  'help.guide.plan-transit.step.4':
    '下方的标签表示可以使用哪些交通方式：“火车”“地铁”“有轨电车”“公交”“渡轮”和“缆车”。关闭某一项就会排除它，但至少要保留一项。然后点击“搜索”。',
  'help.guide.plan-transit.step.5':
    '每个结果会显示出发和到达时间、总用时、换乘次数和步行距离，线路以徽章显示，时刻表提供颜色时会使用线路各自的颜色。点击其中一个可以展开，逐段查看上车和换乘的站点、站台，以及线路之间的步行路段。',
  'help.guide.plan-transit.step.6': '点击“添加到当天”。',
  'help.guide.plan-transit.result':
    '这条换乘会成为当天的一行，带有线路徽章。点击它的箭头可以查看每一段。它同时也是“交通”标签页里已确认行程中的一张蓝色卡片。',
  'help.guide.plan-transit.tip.1':
    '换乘信息来自 Transitous，这是一个基于公开时刻表数据的免费社区服务，不需要密钥，也不需要账号。管理员可以把搜索改为使用 Google。',
  'help.guide.plan-transit.tip.2':
    '什么都没找到？数据源只覆盖某个地区和时段。试试换个时间，打开更多出行方式，或者选车站而不是地点本身。提示里会写明是哪个服务给出了答复。没有日期的旅行没有可搜索的日期，所以只提供普通表单。',
  'help.guide.plan-transit.tip.3':
    '同样的搜索也可以针对单独一段打开：点击两个停留点之间的行程时间连接线，选择“公共交通”。出发地、目的地和出发时间会自动填好。',
  // change-transit-route
  'help.guide.change-transit-route.title': '打开并修改已规划的换乘',
  'help.guide.change-transit-route.goal': '逐段查看这条线路，给它改名，或者重新搜索路线。',
  'help.guide.change-transit-route.step.1':
    '在“交通”标签页中，规划好的线路是一张带蓝色顶部色带的卡片，与已确认的交通一起按时间顺序排列。如果在“视图选项”中开启了“公共交通单独成区”，它会改为显示在“自动公共交通”下。点击这张卡片，这条线路会作为预订打开。',
  'help.guide.change-transit-route.step.2':
    '顶部的方块显示出发和到达及其站点、“时长”“换乘”和“步行”。下方的“行程”逐段显示这条线路，包括时间、站台和线路之间的步行路段。',
  'help.guide.change-transit-route.step.3':
    '点击预订底部的“更改路线”，会重新打开搜索，并已填好这段换乘的起终点和日期。',
  'help.guide.change-transit-route.step.4':
    '点击“搜索”，打开另一条换乘，再点击“添加到当天”，它就会取代旧的那条。预订底部最右边的“编辑”则会打开常规的交通表单，可以修改“预订码”、同行人、备注和文件。',
  'help.guide.change-transit-route.result':
    '这趟行程现在使用新的换乘方案，它在“交通”标签页上的卡片也会显示新的线路和时间。',
  'help.guide.change-transit-route.tip.1':
    '点击预订头部的标题，可以给这条换乘重命名，而不改变路线。备注要在点击“编辑”后打开的交通表单里填写。',
  'help.guide.change-transit-route.tip.2': '预订底部的垃圾桶图标会在确认后删除这条线路，当天的停靠点则保持不变。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '更改某一段的出行方式',
  'help.guide.leg-travel-mode.goal': '把驾车日中的某一段改为步行，或者用公共交通搜索来规划这一段。',
  'help.guide.leg-travel-mode.step.1':
    '停留点之间的连接线只有在当天的路线开启后才会出现。点击这一天的标题展开它，再点击停留点下方那一栏里的“路线”。',
  'help.guide.leg-travel-mode.step.2':
    '每条连接线显示这一段的行程时间和距离，并带有规划时所用出行方式的图标：汽车表示驾车，脚表示步行，自行车表示骑行。',
  'help.guide.leg-travel-mode.step.3':
    '点击连接线。菜单中有“驾车”“步行”“骑行”“公共交通”（仅用于这一段），以及“使用当日默认”。',
  'help.guide.leg-travel-mode.step.4': '选择“步行”。只有这一段会改变，当天的其余部分保持各自的出行方式。',
  'help.guide.leg-travel-mode.result': '这一段会显示步行图标和步行时间，当天其他各段仍使用当天的出行方式。',
  'help.guide.leg-travel-mode.tip.1':
    '出行方式属于路段，而不属于某一天：整天的“驾车”“步行”和“骑行”按钮不会覆盖你手动设置过的路段。点击“使用当日默认”，该路段就会重新跟随这些按钮。',
  'help.guide.leg-travel-mode.tip.2': '同一个菜单里的“公共交通”会针对这一段打开换乘搜索，两端和出发时间都已填好。',
  'help.guide.leg-travel-mode.tip.3':
    '用时由公共路径服务按真实的道路和步道计算。如果某一段算不出来，这一段会保留直线，并且不显示用时。',
  // edit-transport
  'help.guide.edit-transport.title': '修改或删除交通',
  'help.guide.edit-transport.goal': '修改时间、站台或预订码，或者把这段交通从旅行中移除。',
  'help.guide.edit-transport.step.1':
    '在当天计划中，交通是站点之间的一行，按类型着色。点击它会打开对应的预订：顶部的标签显示状态、类型、日期和“预订码”（带复制按钮），下方是出发和到达时间以及对应的机场或车站。',
  'help.guide.edit-transport.step.2':
    '点击预订底部的“编辑”，会打开当初创建它的表单，头部标题上方写着“编辑交通”。你可以修改所有内容：标题、状态和类型标签、路线、日期和时间、“预订码”。',
  'help.guide.edit-transport.step.3':
    '航班的路线是一串机场，火车是一串车站，邮轮是一串港口。“添加经停”（邮轮上是“添加港口”）会在中间再加一个，每一段都保留自己的时间和自己的航班号或车次。',
  'help.guide.edit-transport.step.4':
    '点击“更新”。要彻底删除这段交通，可以点击同一栏左侧的垃圾桶、预订底部的垃圾桶，或“交通”标签页中对应卡片上的垃圾桶，然后确认。',
  'help.guide.edit-transport.result':
    '修改会体现在这段交通出现的所有位置：“交通”标签页、它所在的那一天，以及它在地图上的线路。',
  'help.guide.edit-transport.tip.1':
    '两个入口打开的是同一个表单：从日程中某一行打开的预订里的“编辑”，以及“交通”标签页中卡片上的铅笔。已规划的公共交通换乘同样以预订的形式打开，那里的“更改路线”会重新打开搜索，“编辑”则打开这个表单。',
  'help.guide.edit-transport.tip.2': '要把交通移到另一天，不需要打开表单：直接把它的行从一张日期卡片拖到另一张上即可。',
  // transport-on-map
  'help.guide.transport-on-map.title': '在地图上显示交通',
  'help.guide.transport-on-map.goal': '查看航班、驾车或乘车线路实际经过的路线。',
  'help.guide.transport-on-map.step.1':
    '起点和终点都已设置的交通，在日程中的那一行会显示一个小路线图标。点击它，提示文字会变成“隐藏预订路线”。',
  'help.guide.transport-on-map.step.2': '路线会画在地图上，两端各有一个带交通方式图标的胶囊形标记。',
  'help.guide.transport-on-map.step.3':
    '点击端点标记，预订会在地图上方打开。标题显示状态、类型、日期和“预订码”，下面是时间及对应的机场或车站、航空公司和航班号。点击标题中的“关闭”即可关闭。',
  'help.guide.transport-on-map.step.4':
    '天数上方工具栏里的路线图标可以一次操作整个旅行：“显示所有预订路线”，以及再次隐藏用的“隐藏所有预订路线”。',
  'help.guide.transport-on-map.step.5':
    '已规划的公共交通线路没有单独的路线图标，它是通过当天的“路线”开关画出来的。因此只要当天的路线还开着，“隐藏所有预订路线”就不会隐藏它。',
  'help.guide.transport-on-map.result': '路线会连同两端的标记一起显示在地图上，直到你再次把它们关闭。',
  'help.guide.transport-on-map.tip.1':
    '航班、邮轮和渡轮画成曲线；汽车、公交、出租车和自行车沿着真实道路；火车或规划好的线路则会经过沿途停靠的各个车站。',
  'help.guide.transport-on-map.tip.2':
    '已确认的预订画成实线，待确认的画成虚线。“预订路线标签”设置决定端点标记上显示机场代码还是车站名称。',
  'help.guide.transport-on-map.tip.3':
    '“显示所有预订路线”不是在已显示的路线上叠加，而是用它的设置取代你用单个图标设好的状态。点击之后，所有路线要么全部显示，要么全部隐藏。',
  // airtrail-import
  'help.guide.airtrail-import.title': '从 AirTrail 导入航班',
  'help.guide.airtrail-import.goal': '把你已经记在 AirTrail 里的航班一次性导入旅行，并在之后继续与 AirTrail 保持更新。',
  'help.guide.airtrail-import.step.1':
    '开启 AirTrail 扩展，并在“设置”的“集成”中连接好你的实例后，“交通”标签页的工具栏里，“交通”之前会出现一个飞机图标，即“从 AirTrail 导入”。点击它。',
  'help.guide.airtrail-import.step.2':
    '“从 AirTrail 导入”会把你账户中的航班分成两组。“行程期间”是日期落在旅行范围内的航班，已默认勾选；“其他航班”是其余的航班，未勾选。已经在旅行中的航班会显示为灰色，并标注“已导入”。',
  'help.guide.airtrail-import.step.3':
    '每一行都是一个勾选框，显示航空公司和航班号、两个机场以及日期。点击某一行即可选择是否导入这个航班。“其他航班”下的航班只有在你勾选后才会导入。',
  'help.guide.airtrail-import.step.4':
    '衔接的航班会归为一组：同一天内，每一程都从上一程降落的机场起飞。下方的复选框“导入为一个航班（在该机场中转）”默认已勾选。想合成一条带经停的预订就保持勾选，想把各航段作为单独的航班导入就取消勾选。',
  'help.guide.airtrail-import.step.5':
    '点击右下角的按钮，上面显示已勾选的航班数，例如“导入 2”。完成后的提示会告诉你导入了多少个航班。',
  'help.guide.airtrail-import.step.6':
    '这些航班会显示为“已确认”下的卡片，每张卡片标题旁边都有一个蓝色的 AirTrail 标签，同时也会显示在航班所在日期的行里。联程航班是一张卡片，它的航线会经过中转地。',
  'help.guide.airtrail-import.result':
    '来自 AirTrail 的航班会显示为“交通”标签页上的卡片和各自日期上的行，每个航班都带有 AirTrail 标签，标明来源。',
  'help.guide.airtrail-import.tip.1':
    '旅行中已有相同航班号和日期的航班会被跳过，并提示跳过了多少个。天数上方工具栏里的撤销箭头可以撤销整次导入。',
  'help.guide.airtrail-import.tip.2':
    '数据仍以 AirTrail 为准。TREK 会在你打开旅行时读取它的更改，并在后台每隔几分钟读取一次。在 AirTrail 中删除的航班，卡片会保留在 TREK 中，标签变为“未同步”。只有在“集成”中开启“将更改写回 AirTrail”后，你在 TREK 中的修改才会回传给 AirTrail。',
  'help.guide.airtrail-import.tip.3':
    '合并的联程不是 AirTrail 中可同步的单个航班，所以只能一次性导入：它会保留蓝色标签，鼠标悬停在标签上时会有说明。已同步的航班如果你手动加了经停，也会变成这样。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '公路旅行',
  'help.ctx.trip-roadtrip.summary':
    '把计划当成一次自驾来看：日期和地点都不变，但串联成一个个停靠点，中间是行驶路段，显示在左栏的行程条和地图上。它会告诉你距离和驾驶时间、哪里需要加油，以及沿途有什么。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左栏顶部的“天”和“公路旅行”可以在每日计划和驾驶路线之间切换。不会复制或改动任何内容：切回“天”，计划原样不变。',
  'help.ctx.trip-roadtrip.bullet.2':
    '侧栏顶部汇总整个旅行：距离、驾驶时间和停留点。下面是每个有行车的日子各一张卡片：图块上是日期编号和日期，然后是公里数和驾驶时间的标签、当天的停留点数量、途经的内容，以及“轨迹”徽章。你预订的航班、火车或渡轮会作为单独的卡片出现在序列中。',
  'help.ctx.trip-roadtrip.bullet.3':
    '带编号的站点是当天要去的地点。途中顺路的站点，例如加油、充电或休息区，显示其类型的图标而不是编号，也不计入编号。点击编号可更改它是哪一种，点击“停留”徽章可设置停留多久，拖动站点可在当天内移动，或移到另一天。',
  'help.ctx.trip-roadtrip.bullet.4':
    '两个停靠点之间有一条驾驶条，显示这一段的距离和用时。点击它可以打开“这一段的走法”，也可以点击地图上的路线，让这一段经过一个途经点。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右侧栏变成“路线途中”：在一行里选择要找的内容和日期，设定走廊的宽度，然后点“搜索”。结果上的加号即“添加”，会把它加到行程中你实际经过的位置；酒店上的床图标会添加一晚住宿。“手动”可以添加搜索没有找到的地点，标题旁的三个点可以导入 Google 地图路线。',
  'help.ctx.trip-roadtrip.bullet.6':
    '其下方的“驾驶设置”包含各种限制、汽车及其续航、每日行驶时间、要避开的内容、线条的画法，以及地图上是否显示当前警告。这些设置属于旅行本身，所以每个人都按同一辆车来规划。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '把旅行当作一次驾驶来查看',
  'help.guide.roadtrip-mode.goal': '把计划切换到公路旅行模式，并了解行程条显示的内容。',
  'help.guide.roadtrip-mode.step.1':
    '在左栏顶部的“天”和“公路旅行”切换中，点击“公路旅行”。日程计划会换成驾驶行程，地图上会显示所有已有路线的日期。',
  'help.guide.roadtrip-mode.step.2':
    '导轨顶部的卡片汇总整个旅行：“距离”“驾驶时间”和“停留点”。滚动下面的日期时，它保持不动。',
  'help.guide.roadtrip-mode.step.3':
    '其下是每个有行车的日子各一张卡片，没有行车的日子不显示。卡片标题显示日期编号和下方的日期，然后是表示行车距离和用时的标签，以及表示当天有多少个停留点的标签。',
  'help.guide.roadtrip-mode.step.4':
    '在卡片内，一天显示为一个序列：每个地点是一个带编号的站点，每两个站点之间是一段行车，右侧边缘是到达时间。你预订的航班、火车或渡轮会作为单独的卡片出现在序列中。',
  'help.guide.roadtrip-mode.step.5':
    '点击某一天的标题可折叠它，末端的箭头会随之旋转。折叠的日子也会从地图上隐藏。再次点击标题即可重新显示。',
  'help.guide.roadtrip-mode.result':
    '左栏显示驾驶行程，地图显示它的每一天。点击“天”可以直接切回计划，计划不会有任何变化。',
  'help.guide.roadtrip-mode.tip.1':
    '这个选择按旅行保存在你的账号里，所以刷新页面、换浏览器或换设备后，旅行依然以公路旅行视图打开。',
  'help.guide.roadtrip-mode.tip.2': '只有管理员在管理后台的“扩展”中开启“公路旅行”扩展之后，才会显示这个切换。',
  'help.guide.roadtrip-mode.tip.3': '手机上没有这个切换：该扩展会在“计划”旁边增加一个单独的“公路旅行”标签页。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中的停靠，以及停留多久',
  'help.guide.roadtrip-stops.goal': '把途中的一个地点设为沿途停靠点，并设置每个停靠点需要多长时间。',
  'help.guide.roadtrip-stops.step.1':
    '点击行程条中某个停留点前面的编号。它的标签是“设为途中停靠”，点开后下方会出现一排彩色圆片，代表各种停靠类型。',
  'help.guide.roadtrip-stops.step.2':
    '选择一个类型。把鼠标悬停在圆片上可以看到名称：“住宿”“燃油”“充电”“服务区”“露营地”“餐饮”或“景点”。编号会变成该类型的图标，下方的停靠点会重新编号。',
  'help.guide.roadtrip-stops.step.3': '途中停靠点不是目的地，所以这一天标题里的停靠点数量会少算一个。',
  'help.guide.roadtrip-stops.step.4':
    '再次点击该图标，即“更改停靠类型”，选择“恢复为目的地”，这个停靠点就会重新获得编号。',
  'help.guide.roadtrip-stops.step.5':
    '每个站点都有一个“停留”徽章，没有安排时间时显示加号。点击它可打开“在此停留时间”。',
  'help.guide.roadtrip-stops.step.6':
    '用滑块、减号和加号按钮，或者某个预设值来设置时长。“出发”会随之变化，而“到达”保持在驾驶抵达的时间。然后点击“保存”。',
  'help.guide.roadtrip-stops.result':
    '你修改过的停靠点，其“停留”标记会显示新的时长，之后每个到达时间也会相应顺延。如果把一个停靠点改成了某个类型又改了回来，它会重新成为带编号的目的地。',
  'help.guide.roadtrip-stops.tip.1': '停留时长属于地点，而不是某一次到访：同一个地点安排在两天，两天的停留时长相同。',
  'help.guide.roadtrip-stops.tip.2':
    '途中停靠点也会显示在“天”下。在“驾驶设置”的“服务停靠点”里关闭“也显示于每日行程”，它们就只显示在“公路旅行”中。',
  'help.guide.roadtrip-stops.tip.3': '同一个对话框里的“不停留”会再次去掉停留时长。',
  'help.guide.roadtrip-stops.tip.4':
    '点击一个途中停靠点或已预订的住宿晚，会在地图上方打开它的卡片。开启“公路旅行”后，那里的“编辑”会打开搜索使用的精简对话框，而不是地点表单，在该对话框里点击“更多详情”才会打开完整表单。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '沿途查找加油站、餐厅和住处',
  'help.guide.roadtrip-corridor.goal': '沿着你实际行驶的道路搜索，并把找到的地点加到正确的路段上。',
  'help.guide.roadtrip-corridor.step.1':
    '在“查找”下打开列表，勾选你需要的类型。“燃油”“充电”“服务区”“露营地”“住宿”“餐饮”和“景点”可以组合选择：列表会保持打开，方便你再选第二项，之后输入框里会为每个类型显示一个图标。',
  'help.guide.roadtrip-corridor.step.2':
    '在同一行末尾的下拉菜单中选择日期。菜单里是行程条上有卡片的那些天，“搜索”会等到你所选日期的路线算好之后才开始。',
  'help.guide.roadtrip-corridor.step.3': '在“范围内”选择道路两侧要查找的距离：2 km、5 km 或 10 km，然后点击“搜索”。',
  'help.guide.roadtrip-corridor.step.4':
    '结果按类型分组，顺序就是你经过它们的先后。每一项都会显示它离路线多远，以及位于当天行程的多远处。',
  'help.guide.roadtrip-corridor.step.5':
    '点击“添加”，即结果上的加号。“添加为停靠点”会说明它加在哪一天、哪个位置，并询问“停靠类型”和“在此停留时间”；充电桩还会显示“可用状态与费率”。“添加”把它放进行程，“更多详情”则改为打开完整的地点表单。',
  'help.guide.roadtrip-corridor.result':
    '你添加的停靠点会带着该类型的图标，出现在路线上经过它的位置。这一天会重新经由该停靠点计算路线，同时清空列表：下一个停靠点请重新搜索。',
  'help.guide.roadtrip-corridor.tip.1': '在你点击“搜索”之前不会搜索任何内容：一次搜索会向共享服务发出很多请求。',
  'help.guide.roadtrip-corridor.tip.2':
    '“按名称筛选”无需重新搜索就能筛选结果，“清除结果”会清空列表并移除对应的图钉。点击某个结果，即可在地图上显示它。',
  'help.guide.roadtrip-corridor.tip.3':
    '你也可以把地图上的结果拖到路线上。同一条路要走两次时，可以用这种方式自己选择路段。“搜索”旁边的“手动”可以按名称查找并添加搜索没有找到的地点。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '用途经点调整一段路线',
  'help.guide.roadtrip-via.goal': '让某一段走你想走的路，而不必为它添加停靠点。',
  'help.guide.roadtrip-via.step.1':
    '先在地图上显示你想调整的那一段：点击行程条中的一个停留点，然后关闭在地图上方打开的卡片。',
  'help.guide.roadtrip-via.step.2': '点击画出的路线。你点击的那一段上会添加一个途经点，这一段会经由它重新计算路线。',
  'help.guide.roadtrip-via.step.3':
    '行程条随之更新：这一天的标题显示新的距离和驾驶时间，途经点之后的每个到达时间也会随之变化。',
  'help.guide.roadtrip-via.step.4':
    '把鼠标停在手柄上，会提示它的用法：拖动可改变路线，右键可删除。把它拖到别的位置，这一段会重新经过新的途经点绘制。',
  'help.guide.roadtrip-via.step.5': '右键点击手柄即可删除它，这一段会重新走最直接的路线。',
  'help.guide.roadtrip-via.result': '这一段会沿着你选择的道路走，当天的距离、驾驶时间和到达时间也会重新计算。',
  'help.guide.roadtrip-via.tip.1': '途经点不是停靠点：它没有编号、没有停留时长、没有到达时间，也不计入当天的停靠点数。',
  'help.guide.roadtrip-via.tip.2': '拖动手柄只在缩放级别 9 及以上才显示，所以显示整个旅行的地图只有线条，没有手柄。',
  'help.guide.roadtrip-via.tip.3': '点击位置距离任何已绘制路段超过两公里时会被忽略，点击航班、火车或渡轮也一样。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '换一条路来走这一段',
  'help.guide.roadtrip-alternatives.goal': '查看路线引擎为行程中某一段提供的其他路线，并选择其中一条。',
  'help.guide.roadtrip-alternatives.step.1':
    '点击侧栏里的驾驶条，也就是两个停靠点之间显示这一段距离和用时的那一行。它的标签是“其他路线”。',
  'help.guide.roadtrip-alternatives.step.2':
    '“这一段的走法”会在地图上方打开，每条道路一项，并显示它的长度。地图上会为每条道路标出驾驶时间：当前走的道路用深蓝色，其他道路用浅蓝色。',
  'help.guide.roadtrip-alternatives.step.3':
    '鼠标悬停在某一项上，会高亮对应的道路。“当前”是你正在使用的道路，“最快”是用时最短的；其他选项会显示慢多少，或避开了哪类道路。',
  'help.guide.roadtrip-alternatives.step.4': '点击某一项就改走那条路线，点击“关闭”则保留当前路线。',
  'help.guide.roadtrip-alternatives.result': '这一段现在走你选的路，侧栏里的距离和之后的到达时间也会随之变化。',
  'help.guide.roadtrip-alternatives.tip.1':
    '选择另一条路时，TREK 会先用公路旅行的路线引擎检查它，然后用尽可能少的途经点把这一段固定在这条路上，并替换这一段原有的途经点。路线引擎无法行驶的道路不会被保存。选回路线引擎自己的那条路，则会再次去掉这些途经点。',
  'help.guide.roadtrip-alternatives.tip.2':
    '“不走高速”“免收费”和“不乘轮渡”来自另一个路线引擎，它有自己的速度模型，所以这几项的用时不能和其他路线直接比较。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '设置车辆和驾驶限制',
  'help.guide.roadtrip-limits.goal': '告诉 TREK 你开什么车，以及你希望一次最多连续开多远。',
  'help.guide.roadtrip-limits.step.1': '“驾驶设置”位于右栏搜索框的下方。它的徽章显示已设置的内容，点击即可展开。',
  'help.guide.roadtrip-limits.step.2':
    '在“驾驶”下，“单次最长驾驶”和“每天驾驶”以分钟为单位。留空表示“关闭”，不会标出任何提醒。',
  'help.guide.roadtrip-limits.step.3':
    '在“车辆”下选择你开的车。“燃油”只在加油站补给，“电动”只在充电站补给，“两者”则两种都可以。',
  'help.guide.roadtrip-limits.step.4':
    '自己输入“单箱续航”或“每次充电续航”。也可以打开“加到”下的“根据车辆数据推算”：填入“油箱容量”和“能耗”，或“电池容量”“能耗”和“电池衰减”，由它计算续航。',
  'help.guide.roadtrip-limits.step.5':
    '左栏中的“尽量避开”只是偏好，不是禁令：如果某天没有别的路，仍会走那条路，并在标题中给出提示。',
  'help.guide.roadtrip-limits.step.6':
    '点击“关闭”。卡片上的徽章显示已设置的内容，导轨会标出每一段和每一天中超出限制的部分。',
  'help.guide.roadtrip-limits.result': '卡片上的徽章显示已设置的内容，每个超出上限的路段和日期在行程条里都有一个徽章。',
  'help.guide.roadtrip-limits.tip.1': '这些设置属于这次旅行，所以同行的每个人都按同一辆车和同样的限制来规划。',
  'help.guide.roadtrip-limits.tip.2':
    '“加到”说明站点加油或充电加到多满，因为没有人会在路上充到 100 %。加油或充电站点可以用所在行的电池徽章覆盖这个设置。',
  'help.guide.roadtrip-limits.tip.3':
    '在“路线线条”下，“连接各天”还会规划从前一天最后一个停靠点到后一天第一个停靠点的驾驶路线；“每天从住处出发，并在住处结束”会让每天从这些夜晚所订的住宿出发并回到住宿；“每天一种颜色”则用各自的颜色显示每一天。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '设置每天驾驶的开始和结束时间',
  'help.guide.roadtrip-day-window.goal': '在你选定的时间停止驾驶，并设置这一天的终点。',
  'help.guide.roadtrip-day-window.step.1': '打开右栏中的“驾驶设置”，在对话框的左栏中找到“每日出行时间”。',
  'help.guide.roadtrip-day-window.step.2':
    '设置“一天开始时间”。单独设置没有任何效果：正如下方的说明所写，需要同时设置两个时间。',
  'help.guide.roadtrip-day-window.step.3':
    '设置“一天结束时间”。驾驶现在会在这个时间停下，并在第二天早上继续，侧栏中会显示为“当天行程结束”和“继续行程”两行。',
  'help.guide.roadtrip-day-window.step.4':
    '在“一天的结束地点”下，选择“路线途中”表示到结束时间就在路上停下；选择“最后一个地点”表示在下一段驾驶会超过结束时间之前，停在最后一个地点。',
  'help.guide.roadtrip-day-window.step.5': '点击“关闭”。“驾驶设置”卡片会用徽章显示这两个时间。',
  'help.guide.roadtrip-day-window.result':
    '驾驶路程会按你设定的长度切分成多个出行日，放不下的部分会接在最后一天之后，作为推算出来的天数继续。你原有的日期和其中的地点不会改变。',
  'help.guide.roadtrip-day-window.tip.1':
    '如果清除其中任何一个时间，这项功能就会再次关闭。你自己为某个停靠点设置的时间始终优先。',
  'help.guide.roadtrip-day-window.tip.2':
    '设置了每日出行时间后，各天总是相连的：从某一天最后一个停靠点到次日第一个停靠点的驾驶，也会规划路线并计入。',
  'help.guide.roadtrip-day-window.tip.3':
    '每天的结束地点在地图上也是一个标记，即带日期编号的月亮图标。沿路线拖动它，或拖到某个地点上，就能把这一天结束在别处。右键点击它可恢复自动结束地点，这个对话框中的“恢复自动每日终点”会撤销所有这些更改。想让某一天结束在某个站点，点击该站点，并在其卡片中打开“在此结束当天行程”。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '油用完之前先加油',
  'help.guide.roadtrip-refuel.goal': '在车辆还能到达的路段上找一个加油的地方，并加入行程。',
  'help.guide.roadtrip-refuel.step.1':
    '设置续航后，侧栏会在燃油或电量耗尽的路段上显示一条带：“此处将耗尽油量”，电动车则显示“电量将在此耗尽”。下方显示这个位置在该路段中走了多远。',
  'help.guide.roadtrip-refuel.step.2':
    '带上的灯形图标就是按钮：“查找加油站”，电动车则是“查找充电站”。它会沿着该点之前的道路搜索，搜索期间显示“正在沿路线查找…”。',
  'help.guide.roadtrip-refuel.step.3': '最多显示三个加油站，每个都标明离路线多远，以及到达时还剩多少续航。',
  'help.guide.roadtrip-refuel.step.4':
    '候选项上的加号会把它添加为加油停靠点。“添加为停靠点”打开时，类型和时间已经填好，点击“添加”会把它放到路段上路线实际经过它的位置。',
  'help.guide.roadtrip-refuel.result':
    '这个停靠点会带着自己的图标出现在正确的路段上，续航也从这个停靠点重新开始计算。续航带会移到油箱现在耗尽的位置；如果剩下的路程无需再停靠就能开完，续航带就会消失。',
  'help.guide.roadtrip-refuel.tip.1':
    '续航里程从上一次加油或充电的停靠点开始计算，可跨天。“你开什么车”决定哪些停靠点有效：“燃油”只算加油，“电动”只算充电。',
  'help.guide.roadtrip-refuel.tip.2':
    '搜索只查看燃料耗尽点之前的路段，会预留余量，并把绕行距离按往返两次计算，所以提供的每个地点都确实能到达。',
  'help.guide.roadtrip-refuel.tip.3':
    '如果没有结果，可以再搜索一次：提示灯会变成“重试”，因为地点搜索是共享服务，偶尔会超时。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '让某一天沿着导入的轨迹行驶',
  'help.guide.roadtrip-track.goal': '把你以 GPX 或 KML 轨迹导入的风景路线，用作某一天的驾驶路线。',
  'help.guide.roadtrip-track.step.1': '点击某一天标题栏中的“轨迹”标记，对话框会在那一天上打开。',
  'help.guide.roadtrip-track.step.2':
    '选择一条轨迹。每条轨迹都会显示它的长度，以及它是否沿着这一天的路线，或者离这一天的路线有多远。最近的轨迹排在最前面。',
  'help.guide.roadtrip-track.step.3':
    '点击“沿此轨迹行驶”。TREK 会在行驶路线偏离轨迹最远的位置添加途经点，并重新计算路线，如此重复几次。',
  'help.guide.roadtrip-track.step.4':
    '对话框会告诉你放置了多少个途经点、行车路线现在与轨迹的贴合程度，或说明行车路线本来就沿着轨迹。左下角的“放弃途经点”会移除它们，路径规划器会重新规划当天。关闭对话框会保留轨迹。',
  'help.guide.roadtrip-track.result':
    '这一天的行程会沿着轨迹走，而不是导航本来会选的那条路。把鼠标移到它的“轨迹”标记上，可以看到轨迹的名称。当途经点让行程保持在轨迹上时，这个标记也会高亮。',
  'help.guide.roadtrip-track.tip.1':
    '对话框列出旅行中带有路径的地点：即在“天”下的地点栏中用“导入文件”导入的 GPX 或 KML，导入 GPX 时勾选了“路线”或“轨迹（含路径几何）”，导入 KML 时勾选了“路径（LineStrings）”。只有游览扩展关闭时才有“导入文件”；游览扩展开启时，GPX 会变成游览路线，不会在这个对话框中列出。旅行里没有轨迹之前，任何一天都不会显示这个徽章。',
  'help.guide.roadtrip-track.tip.2':
    '沿轨迹行驶会替换这一天各路段原有的途经点，所以请先沿轨迹行驶，再手动调整某一段的走向，不要反过来。',
  'help.guide.dateless-trip.step.1': '点击“新建旅行”，给旅行起个名字。',
  'help.guide.edit-trip.tip.2': '在这里添加或移除旅伴会立即生效，不用点“更新”。',
  'help.guide.trip-reminder.result': '旅行开始前，你会在所选的天数收到提醒，提醒会发到你接收通知的渠道。',
  'help.guide.upcoming-reservations.step.1':
    '在右侧栏找到“接下来的预订”。它按时间先后列出你所有旅行中最近的六条预订，并显示日期、时间和类型。',
  'help.guide.half-company-holiday.step.1': '把工具栏切换到“公司假日”。',
  'help.guide.edit-holiday-calendar.result': '每次修改后，网格和图例都会立即更新。',
  'help.guide.person-color.result': '这位成员记录的所有日期都会改用新颜色显示。',
  'help.guide.answer-fusion-request.step.1': '有人邀请你后，打开“假期”。“合并请求”对话框会自动弹出。',
  'help.guide.log-for-partner.step.1': '在“人数”卡片中点击对方的名字。出现勾号就表示已选中。',
  'help.guide.dissolve-fusion.step.1': '打开“设置”。',
  'help.guide.country-places.step.2': '点击卡片中的“地点”徽章，就是带图钉的那个。',
  'help.guide.search-place.tip.2': '如果该地区已被标记，弹窗会问你是否改为移除。',
  'help.guide.tour-activity-stats.step.4':
    '右侧的徽章说明汇总的依据：“计划于”表示按旅行规划计入的路线，“记录”表示已关联实际轨迹的路线。“即将进行”“未安排日期”和“无日期”表示尚未计入的路线。点击 i 可查看规则。',
  'help.guide.move-to-list.step.2': '点击“复制到列表”会在这里也保留一份，点击“移动到列表”则会从当前列表中移除。',
  'help.guide.accept-list-invite.title': '接受列表邀请',
  'help.guide.tour-collection-add-to-trip.step.3':
    '在“路点”下，选择带路点的图块，会按顺序带入起点、途经点和终点；选择“仅线路”则只带入保存的线路。',
  'help.guide.tour-collection-manage.step.1':
    '打开一个列表。每条保存的路线都会显示难度、类型、保存自哪个旅行、距离和爬升，以及路点数量。把鼠标移到旅行名称上，可以看到是谁保存的。',
  'help.guide.entry-draft.step.1': '在编辑器中，打开右侧栏的“草稿”开关。',
  'help.guide.journey-map-layers.step.3':
    '点击地图上的空心图钉或小圆点。卡片会告诉你它是什么：计划中的地点及其日期，或者一条停留记录，其中的“打开日记”会带你到它所属的当日记述。',
  'help.guide.journey-keep-route.step.3': '点击“保存路线”。',
  'help.guide.journey-day-stays.step.3': '对不想要的停留记录，点击“我没有去过这里”，它就会从列表中消失。',
  'help.guide.journey-take-over-day.step.3':
    '如果想让一整天只有一个条目，把“条目”切换为“当日记述”：一个条目会列出所有选中的停留记录及其时间。',
  'help.guide.journey-auto-prepare.step.2': '在“已记录的日子”下，打开“自动准备记录的日子”。',
  'help.guide.photo-location.step.2': '在“照片”下，打开“根据照片定位条目”。',
  'help.guide.link-trip.tip.3': '如果你在尚未关联的旅行的某一天写条目，编辑器会直接在条目里提供“关联旅行”。',
  'help.ctx.settings-plugins.summary':
    '管理员安装的插件的个人设置：每个插件向你索取的密钥和偏好，以及插件以你的名义执行操作的记录。只有在有插件启用时才会显示此标签页。',
  'help.ctx.settings-about.bullet.3': 'Ko-fi、Buy Me a Coffee 和 Discord 是你支持 TREK 或联系开发团队的地方。',
  'help.guide.language-region.step.3':
    '设置“显示货币”，或保留“行程货币”，让每个旅行按自己的货币显示。然后选择“温度单位”“距离单位”“时间格式”以及“每周开始于”星期几。',
  'help.guide.travel-map-prefs.step.3':
    '“在地图上探索地点”会显示用于查找附近地点的分类标签。“隐藏预订编号”会隐藏确认编号，悬停或点按后才显示。“从住宿地优化路线”让每天从酒店出发并回到酒店。',
  'help.guide.web-push-device.step.2': '在顶部的“通知”卡片中，“推送”一列决定哪些事件会发送到你的设备。',
  'help.guide.connect-airtrail.goal': '让 TREK 导入并同步你自己 AirTrail 里的航班。',
  'help.guide.connect-dawarich.goal': '让 TREK 从你自己的 Dawarich 读取你实际去过的地方。',
  'help.guide.tour-connect-wanderer.goal': '让 TREK 读取你自己 wanderer 里的路线，这样就能把它们导入为游览路线。',
  'help.guide.tour-wanderer-watch.title': 'wanderer 路线有变化时收到通知',
  'help.guide.plugin-settings.tip.2': '“通知”下的插件渠道有一个“去配置”按钮，点击就会打开这个页面。',
  'help.guide.default-user-settings.result': '新账户，以及从未改过这些设置的所有人，都会使用你选的设置。',
  'help.guide.own-routing-engine.goal':
    '让每日路线和公路旅行改走你自己运行的 OSRM 或 Valhalla 服务器，而不是公共服务器。',
  'help.guide.admin-passkeys.tip.1':
    '如果 TREK 还无法确定域名，会显示警告，在你设置 APP_URL 或 Relying Party ID 之前，通行密钥会一直隐藏。',
  'help.guide.rotate-jwt-secret.step.1': '在“设置”标签页底部的“危险区域”中，点击“轮换 JWT 密钥”旁边的“轮换”。',
  'help.guide.storage-backends.tip.3': 'TREK 可以重新下载照片缓存，所以镜像它们通常是浪费存储空间。',
  'help.guide.admin-channels.step.3':
    '在下方的“通知”卡片中，为每个事件选择由哪些渠道发送：“有新版本可用”“存储副本故障”和“划桨区域申请”。每个开关都会立即保存。',
  'help.guide.notification-defaults.tip.1': '“关闭”是默认值，每位用户仍可自行开启；“封锁”则对所有人关闭。',
  'help.ctx.notifications.bullet.4':
    '每条通知时间旁边的“标为已读”（双勾）和“删除”（垃圾桶）只作用于这一条。顶部的“全部标为已读”和“全部删除”作用于整个列表。',
  'help.guide.read-notifications.tip.2': '没有按钮的通知只是提示信息。在面板中阅读，并在那里标为已读即可。',
  'help.guide.filter-notifications.result': '列表只显示仍未读的通知，最新的在前。',
  'help.guide.delete-notifications.title': '删除通知',
  'help.guide.notification-settings.goal':
    '决定哪些事件显示在铃铛图标下，哪些还会通过邮件、webhook、ntfy 或推送发给你。',
  'help.guide.public-link.step.4': '点击“创建链接”，再点“复制”，然后把链接发出去。',
  'help.guide.link-journal.step.2': '点击“关联日志”，在“选择一本日志”中选一本你的日志。',
  'help.guide.dawarich-stays.title': '把记录的停留变成地点',
  'help.guide.dawarich-stays.tip.2': '如果删除由停留记录创建的地点，该停留记录会以“等待中”的状态回到列表。',
  'help.guide.leave-stop-off-route.goal': '让站点留在当天，但路线不经过那里，适合步行路过或只想在地图上标出的地点。',
  'help.guide.day-route.tip.4': '如果某个站点要放在当天但不走路线，在它的菜单中选择“从路线中排除”。',
  'help.guide.move-booking-day.step.2':
    '把这一行拖到另一天卡片的标题上。单日预订会整个移到那一天。跨多天的预订则是：“出发”行移动开始的那天，“到达”行移动结束的那天。',
  'help.guide.place-image-from-file.title': '用附加的照片作为地点图片',
  'help.guide.place-image-from-file.tip.2': '固定在站点上或附加在其预订上的照片也可以选。',
  'help.guide.place-own-hours.step.5':
    '点击“更新”。卡片现在会在“营业时间”下显示你填的时间，顶部的“营业中”或“已关闭”也以此为准。',
  'help.guide.confirm-stay-booking.step.3': '点击顶部的“待确认”。它的提示会显示“设为已确认”，圆点变成绿色。',
  'help.guide.map-nearby-places.tip.4': '搜索失败的分类会出现红点，“搜索此区域”会变红并带警告标志：点击它重试。',
  'help.guide.tour-map-lines.tip.1': '在日期栏中折叠某一天后，它的游览路线和站点都会从地图上隐藏。',
  'help.guide.car-stops.step.3':
    '在标题栏输入标题。在“路线”下，于“从”中选取车地点，于“到”中选还车地点；输入之前会先列出旅行自己的地点。“取车”和“取车时间”填写何时取车，“还车”和“还车时间”填写何时还车。',
  'help.guide.transport-details.step.1':
    '在“交通”标签页中点击一张卡片。详情会盖在标签页上方，标题栏的颜色与卡片一致。当天计划中的交通行也会打开同样的详情。',
  'help.guide.export-transports-csv.tip.2':
    '“预订”标签页有同样的图标，导出的是它自己的文件，文件名以 bookings.csv 结尾。',
  'help.guide.group-sort-bookings.step.2':
    '在“分组依据”下选择“状态”“日期”“类型”或“不分组”。标签页会立即按这些分区重新整理。',
  'help.guide.export-bookings-csv.result':
    '浏览器会下载一个以旅行和标签页命名的文件，例如 autumn-in-japan-bookings.csv，标签页显示的每个预订各占一行。',
  'help.guide.arrange-packing-list.result':
    '清单按你拖动后的顺序排列，物品按名称排序，直到你关闭排序为止。TREK 仍会保存你自己的顺序。',
  'help.guide.count-packed-pieces.step.2':
    '数量前会出现一个计数器，如 0/5，带减号和加号。每有一件放进包里，就点一次加号。',
  'help.guide.expense-receipts.step.4':
    '回到账本，这一行的名称旁边有“收据”标签，有多张时括号里显示数量。点击它即可打开收据。',
  'help.guide.final-budget.tip.3': '已离开旅行的人，只要还有款项没有结清，就会在“余额”和“最终花费”中保留一行。',
  'help.guide.files-sync-settings.step.2':
    '流程栏显示 TREK 和你的文档服务，以及各自的文档，两者之间有两条通道：“发往文档服务”和“来自文档服务”。点击“发往文档服务”可以关闭它，该通道会变灰，通道下方的文字变为“仅接收”。再点一次即可重新开启。',
  'help.guide.files-sync-settings.tip.4':
    '只有旅行所有者或管理员可以更改这些设置。其他成员能看到流程栏和类似“文档双向同步”的提示，但没有“设置”。',
  'help.guide.manage-notes.step.2':
    '“展开”会显示整条笔记：完整文本、“网站”和“文件”。点击文件可预览。底部的“编辑”直接切换到编辑器，右上角的叉号会再次关闭笔记。',
  'help.guide.note-categories.goal': '为群组的笔记设置有名称、有颜色的分类，并且一次只显示一个分类。',
  'help.guide.note-categories.tip.1':
    '垃圾桶只能移除没有笔记使用的分类。仍有笔记在用的分类会留在列表中，直到你把这些笔记移到其他分类。',
  'help.guide.roadtrip-reorder.title': '调整站点顺序，或把它移到另一天',
  'help.guide.roadtrip-reorder.tip.3':
    '对于你固定的时间，TREK 不会再询问：导轨会立即重新计算当天，并标出已经来不及到达的站点。',
  'help.guide.roadtrip-overnight.step.3':
    '在对话框顶部，“过夜”添加一晚住宿，“停留”则是在此停留一段时间。酒店默认是“过夜”，露营地默认是“停留”。“过夜”只要求填写“入住”，也可以留空。',
  'help.guide.roadtrip-stop-fill.step.1':
    '在导轨里的加油或充电站点上，点击电池徽章。它显示该站点加到多少：沿用你的“加到”设置时颜色较淡，有自己的数值后则显示为实色。',
  'help.guide.roadtrip-bookings.step.1':
    '把这段行程在当天作为“飞行”“火车”“渡轮”“邮轮”或“公交”预订，且两端都已定位。行车路线会自动包含它：公路在这段行程出发的枢纽处结束，并在它抵达的地方重新开始。',
  'help.guide.roadtrip-google-import.result': '路线的站点会加在当天最后一个站点之后，导轨和地图上的路线都会经过它们。',
  'help.guide.roadtrip-hazards.step.3':
    '警告会以区域的形式画在地图上。点击其中一个，可以看到内容、哪个服务发布的，以及最近更新时间。',
  'help.ctx.trip-tours.bullet.2':
    '顶部的“导入 GPX 或 KML”会把文件导入为游览路线。其下方的筛选按钮（起初是“全部”，带路线数量）可按状态、来源、路线限制和类型缩小列表。',
  'help.guide.tour-show-list.step.2':
    '每一行是一条路线。彩色条是它在地图上的线路，圆形图块显示在 TREK 中规划的徒步的路线限制（T1 到 T6），或其类型图标。名称下方的徽章显示它所在的日期、用时、距离和爬升。多日路线上带数字的月亮图标表示有几个阶段。',
  'help.guide.tour-add-to-day.title': '把路线安排到某一天',
  'help.guide.tour-add-to-day.tip.2':
    '如果旅行在最后一个阶段之前就结束了，选项会显示能排得下的最后一个阶段，之后的阶段仍不安排日期。',
  'help.guide.tour-day-times.step.3':
    '点击“更新”。该行现在显示为开始 → 结束。推算出的结束时间颜色较浅：≈ 表示估算，≥ 表示停留还没有时间，+1 表示过了午夜。鼠标移上去可以看到推算方式。',
  'help.guide.tour-remove-from-day.goal': '取消路线的日期安排，但不删除它。',
  'help.guide.tour-filter-list.goal': '把长列表缩小到你要的路线：尚未规划的、来自文件的、某一类型的。',
  'help.guide.tour-filter-list.result': '列表里只剩下你筛选出的路线，其他路线仍在旅行中。',
  'help.guide.tour-hide-on-map.result': '地图上只显示你想看的路线，隐藏的路线仍留在列表中，显示为暗色。',
  'help.guide.tour-import-plan-tab.result':
    '这条轨迹成为旅行的一条路线：列表里多了一行带 GPX 徽章的记录，地图上多了一条线。',
  'help.guide.tour-detail-read.title': '打开路线并查看它的卡片',
  'help.guide.tour-detail-read.step.7': '点击卡片顶部的 X，或按 Esc 键，即可关闭卡片。',
  'help.guide.tour-rename-colour.goal': '给路线起一个你认得出的名字，再选一个在地图上醒目的线条颜色。',
  'help.guide.tour-take-along.title': '把路线下载到手机或 GPS',
  'help.guide.tour-take-along.tip.4':
    '在“游览”标签页中，同样的下载按钮位于左栏顶部。如果路线有未保存的更改，下载时会先要求你保存。',
  'help.guide.tour-copy-keep.tip.1':
    '两者都是副本：之后对路线的更改，既不会影响这份副本，也不会影响你保存在收藏中的版本。',
  'help.guide.tour-packing-link.step.2':
    '在“关联到”下，选择“整个行李清单”或其中的某个清单。每一行显示它包含多少件物品。',
  'help.guide.tour-files.title': '给路线附加文件',
  'help.guide.tour-activity-link.title': '关联你实际走过的轨迹',
  'help.guide.tour-activity-link.tip.2': '只能关联没有被用来规划路线的导入轨迹，而且每条轨迹只能关联到一条路线。',
  'help.guide.tour-activity-compare.step.4':
    '轨迹下方的“更换”可以选另一条录制的轨迹。“取消关联”会把它从路线上移开，这条轨迹仍作为导入内容留在旅行中。',
  'help.guide.tour-origin-check.step.3': '你在“游览”标签页中画的路线会显示“在 TREK 中规划”，以及“创建时间”所在的日期。',
  'help.ctx.trip-tour-planner.bullet.2':
    '左侧导轨就是编辑器。没有打开任何路线时，它提供“规划新游览路线”。打开一条路线后，会显示名称、类型、路点、该类型的卡片和详情，底部有“放弃”和“保存”。',
  'help.guide.tour-open-workspace.step.2':
    '左侧导轨就是编辑器。没有打开路线时，它提供“规划新游览路线”，可以在地图上开始一条路线。',
  'help.guide.tour-open-workspace.tip.3':
    '编辑器里有未保存的更改时再打开另一条路线，会先询问：“放弃更改”，还是继续编辑。',
  'help.guide.tour-draw-route.step.5':
    '按行走顺序依次点击接下来的地点。每次点击都会把该点加为新的终点，从两个点起，TREK 会沿着小路规划路线。',
  'help.guide.tour-type-profile.goal': '选择路线类型，骑行路线还要选择配置，让路线走合适的道路。',
  'help.guide.tour-edit-points.title': '移动、重新排序和移除点',
  'help.guide.tour-edit-points.tip.1':
    '第一个点带“开始”徽章，最后一个点带“结束”。把某个点移到最上面或最下面，它就成为起点或终点。',
  'help.guide.tour-shaping-points.step.4':
    '要把站点改成塑形点，或改回来，打开该行上的“更多操作”，选择“设为塑形点”或“设为停靠点”。',
  'help.guide.tour-loop-reverse.step.2': '最后一行现在显示“返回起点”，地图上的路线在起点结束。',
  'help.guide.tour-leg-by-hand.step.1': '在这一段起点的点上打开“更多操作”，选择“手动绘制下一段”。',
  'help.guide.tour-trip-places.goal': '把你已在旅行中规划好的地点添加为路线的一个站点。',
  'help.guide.tour-trip-places.result': '路线多了一个站点，对应这个旅行地点，名称相同。',
  'help.guide.tour-details-times.tip.2':
    '对于徒步，“详情”里还有“步道最高难度”和“路线偏好”，徒步指南中有说明。城市漫步没有“休息”：改用你在各站点的停留时间。',
  'help.guide.tour-save.step.4': '这条路线现在列在“本次旅行的游览活动”下，还没有安排日期。',
  'help.guide.tour-edit-saved.step.2':
    '像新建路线一样修改你需要的内容：移动或添加点、切换类型，或编辑详情，这里以“描述”为例。',
  'help.guide.tour-summary-profile.goal': '查看路线有多长、多陡，以及路线上每个高度出现在哪里。',
  'help.guide.tour-summary-profile.result': '你知道了路线有多长、爬升多少、要走多久，以及哪里变陡。',
  'help.guide.tour-list-manage.tip.1':
    '每条路线在合计中只算一次，即使它排在多天。前面带 ≥ 的合计表示有些路线没有计入，鼠标移上去可以看到有多少条。',
  'help.guide.tour-delete.tip.1': '此操作无法撤销，“撤销”也找不回已删除的路线。',
  'help.guide.tour-saved-elsewhere.step.3': '如果你仍然点击“保存”，会改为打开“期间已被更改”，不会覆盖任何内容。',
  'help.ctx.trip-tour-import.bullet.2':
    '“导入预览”会在保存任何内容之前，在地图上显示文件中的每条轨迹，以及其距离、爬升、下降和点数。在“导入为”下，说明这些轨迹是什么。',
  'help.guide.tour-import-gpx.step.3':
    '“导入预览”会打开，此时还没有保存任何内容。地图显示完整路线，文件中的每条轨迹是带编号的一行，显示距离、爬升、下降和点数。录制的轨迹还会显示生成时间和用时。',
  'help.guide.tour-import-gpx.result':
    '这条路线出现在“本次旅行的游览活动”中，还没有安排日期。如果只有一条，会直接在地图上作为“GPX 游览路线”打开。',
  'help.guide.tour-view-import.tip.3': '来自 wanderer 的路线也以同样方式打开，作为“wanderer 游览路线”。',
  'help.guide.tour-plan-from-import.tip.1': '“放弃”会丢弃这个建议。在你保存之前，不会存储任何内容。',
  'help.guide.tour-restore-recorded.step.2': '点击“恢复录制的轨迹”。',
  'help.guide.tour-take-over.step.2': '选择“从其他行程引入路线”。',
  'help.guide.tour-take-over.result': '会有消息确认已引入，路线在编辑器中打开，可以直接安排到某一天。',
  'help.guide.tour-import-wanderer.tip.2':
    '导入的是一份副本：之后 wanderer 里的更改不会影响这条路线。路线“来源”中的“检查来源”会告诉你路线何时有变化。',
  'help.ctx.trip-tour-map.bullet.3':
    '地图顶部的“搜索地点或地址”会把地图移到某个城镇、山屋或山顶，而不会向路线添加任何内容。',
  'help.guide.tour-map-layers.result': '路线会画在适合它的地图上，标签会显示当前使用的是哪一种。',
  'help.guide.tour-along-search.step.3':
    '在“距路线的范围”下，选择在离线路多远的范围内查找：250 米、500 米、1 公里或 2 公里。',
  'help.guide.tour-along-add-stop.goal': '让路线经过你沿途发现的观景点、山屋或泉水。',
  'help.guide.tour-along-add-stop.tip.3':
    '无法加入站点的路段（作为固定线路加入的飞拉达或陆上搬运，或手动绘制的路段）在列表中显示为暗色，旁边注明原因。',
  'help.guide.tour-3d-terrain.result': '你在 3D 地形上看过了这条路线，陡峭路段以颜色标出，规划时再切回平面地图。',
  'help.guide.tour-3d-flyover.step.3':
    '“暂停”让飞行停在当前位置，“播放飞越”从那里继续。“从头开始”回到起点，重新开始飞行。',
  'help.guide.tour-map-overlays.step.1':
    '在“游览”标签页中打开一条滑雪路线。雪道默认就是开启的：开关是左下角标签里的雪山图标，即“雪道、越野滑雪道和缆车”。点击它可在地图上隐藏这些内容，再点一次则重新显示。',
  'help.ctx.trip-tour-stages.title': '多日路线',
  'help.guide.tour-multi-day.goal': '把一条路线分成几个阶段，每个赶路的日子一个阶段。',
  'help.guide.tour-multi-day.tip.2':
    '要把两个阶段重新合并，在带月亮图标的站点菜单中选择“移除阶段终点”。移除该站点同样会合并它们，并有提示提供“撤销”。',
  'help.guide.tour-stages-on-days.step.3':
    '选择“从这一天起按阶段安排”：第 1 阶段放在那一天，之后每个阶段依次放在后一天。“整条路线放在这一天”则把整条路线放在那一天。',
  'help.guide.tour-stages-on-days.result': '每个阶段都安排在旅行的对应日期，你打开的那个阶段显示在编辑器中。',
  'help.ctx.trip-tour-hike.bullet.6':
    '右侧的“游览概览”给出距离、爬升、估算的步行或跑步时间、休息和计划总用时，下方是海拔剖面。编辑器底部的“保存”会保存这条路线。',
  'help.guide.tour-hike-plan.step.6': '点击左栏底部的“保存”。',
  'help.guide.tour-hike-trail-details.step.1':
    '从“本次旅行的游览活动”中打开这条徒步路线，在“路点”卡片下方找到“路径详情”。打开“沿路线显示”。',
  'help.guide.tour-hike-trail-details.tip.3':
    '这张卡片里的内容都不会改变路线，而且需要联网。导入的徒步路线在它的视图中也有同样的卡片，只是没有路线限制。',
  'help.guide.tour-hike-round.result':
    '徒步路线会沿着你选的环线回到起点。地图底部的“已选用环线”带有“撤销”，点“保存”即可保留。',
  'help.guide.tour-hike-compare-ways.step.3':
    '一行上的徽章显示它比当前路线长多少、高多少或慢多少。点击你想要的那一条。',
  'help.guide.tour-ferrata-add.step.1':
    '打开徒步路线后，点击左下角那排地图按钮中的“飞拉达”。徽章统计视野内的飞拉达数量；如果提示放大，就放大地图。',
  'help.guide.tour-ferrata-add.tip.3': '飞拉达路段会在海拔剖面上高亮显示，这样你就能看到一天中大概什么时候走到那里。',
  'help.guide.tour-run-plan.step.5': '在“游览名称”下给这次跑步起个名字，然后点击“保存”。',
  'help.guide.tour-run-ways.step.1':
    '从“本次旅行的游览活动”中打开这条跑步路线，在“路点”卡片下方的“路径详情”里打开“沿路线显示”。',
  'help.ctx.trip-tour-walk.bullet.1':
    '“路线类型”选“城市漫步 / 观光”，路线就变成漫步。其中的点是站点，带有“标签”、停留时间和重要程度。漫步没有徒步限制，也没有“休息”字段：改用各站点的停留时间。',
  'help.guide.tour-walk-plan.step.2':
    '添加站点：确认“添加地点”已开启，然后在每个站点处点击地图，或点击“行程地点”选一个旅行中已有的地点。',
  'help.guide.tour-walk-plan.result':
    '漫步会列出各个站点及其停留时间，“游览概览”会把它们汇总。把它安排到某一天，就能看到何时到达每个站点。',
  'help.guide.tour-walk-sights.tip.1': '它会成为漫步的一个站点，而不是旅行的地点。',
  'help.guide.tour-walk-day-times.step.3':
    '在“游览”标签页中重新打开这次漫步。“路点”顶部的“时间依据”显示日期和开始时间。如果漫步安排在多天，点击它可以选另一天。',
  'help.guide.tour-walk-google-import.goal': '粘贴从 Google 地图分享的步行路线，把它的站点载入为一次漫步。',
  'help.guide.tour-walk-google-import.result':
    '编辑器中会打开一条新的城市漫步，带有来自 Google 地图的站点，可以直接保存。',
  'help.guide.tour-walk-check-off.tip.2': '当天计划中这次漫步的行也会显示计数，例如 3/7。',
  'help.ctx.trip-tour-bike.bullet.4':
    '在“山地”配置下，同一张卡片会显示地图贡献者标注的步道难度（mtb:scale）。没有难度的道路是未知，不代表容易。',
  'help.guide.tour-bike-profile.step.6': '在“游览名称”下输入名称，然后点击左侧导轨底部的“保存”。',
  'help.guide.tour-bike-surfaces.goal': '了解路线有多少是柏油路、砂石路或未知路面，以及经过哪几类道路。',
  'help.guide.tour-bike-surfaces.tip.3':
    '这张卡片按路径规划器规划的路线统计，不会改动路线。它需要联网；离线时会提示，路线不受影响。',
  'help.guide.tour-bike-mtb-grades.tip.1': '“数据中无难度”表示未知，不代表容易。难度也不能说明某条步道是否适合你。',
  'help.ctx.trip-tour-ski.bullet.3':
    '你在地图上点击的每个点，都会沿着雪道、缆车和步道与前一个点相连。每个点下方，它的路段以标签列出，雪道按难度着色，并标有分钟数。无法规划的路段会变红，说明原因，并给出修复办法或“画直线”。',
  'help.guide.tour-ski-plan.step.4':
    '确认“添加地点”已开启，然后按顺序点击地图上你的起点和每个想去的地方。雪道路径规划器会沿着雪道、缆车和步道把每个点与前一个点相连。',
  'help.guide.tour-ski-options.title': '告诉雪道路径规划器你的滑雪方式',
  'help.guide.tour-ski-options.tip.2':
    '“乘坐缆车”对“高山滑雪”和“单板滑雪”默认开启，对其他项目默认关闭。“排除”和“需要时乘缆车下山”只在乘坐缆车时才会显示。',
  'help.guide.tour-ski-fix-leg.tip.1': '你也可以把地图上的点拖到更靠近雪道、步道或缆车的位置。松手后会重新规划该路段。',
  'help.guide.tour-ski-summary.step.2':
    '“滑行”“乘缆车”“等待”和“步行”分别给出各自的用时。“雪道”“雪道下降”和“缆车次数”给出雪道长度、你在雪道上滑下的高度，以及乘缆车的次数。',
  'help.guide.tour-ski-pistes-layer.goal': '查看滑雪路线周围的雪道、越野滑雪道和缆车，以及它们的颜色代表什么。',
  'help.guide.tour-ski-import.title': '导入滑雪轨迹并说明它是什么',
  'help.guide.tour-ski-import.tip.1':
    '导入的轨迹会保持录制时的样子：TREK 不会把它贴合到雪道上，它的卡片里“滑雪用时”显示为“未计算”。',
  'help.ctx.trip-tour-paddle.bullet.3':
    '点上的“更多操作”包含划桨工具：规划水上的下一段或手动绘制、“从这里开始陆上搬运”，以及“此处有船闸”。',
  'help.guide.tour-paddle-setup.step.3':
    '在“船”下选择“皮划艇”“加拿大式独木舟”、SUP 或“其他”。船型决定 TREK 建议的速度。',
  'help.guide.tour-paddle-setup.tip.4': '栏底部的“划桨有风险”一行会打开“水上安全”。第一次规划路线前请读一遍。',
  'help.guide.tour-paddle-water-route.step.5':
    '要一次规划所有手动绘制的路段，点击“路点”标题中的波浪图标“沿水路规划手绘的路段”。',
  'help.guide.tour-paddle-portage.step.1': '指向你上岸的站点，点击“更多操作”，也就是三个点。',
  'help.guide.tour-paddle-portage.result': '该路段在地图和路点中都是陆上搬运，“用时估算”会把它计为搬运。',
  'help.guide.tour-paddle-lock.tip.2':
    '如果有陆上搬运绕过船闸，船闸会变暗并标为“已搬运绕过，按陆上搬运计”。此时计入搬运用时，不再计入船闸的分钟数。',
  'help.guide.tour-paddle-time.step.4':
    '路线上有陆上搬运时，“搬运”一行会统计搬运。点击它的速度，输入你搬运船的速度。“上岸与重新下水”会在每处陆上搬运加上相应的分钟数。',
  'help.guide.tour-paddle-wind.step.1':
    '把划桨路线安排到旅行的某一天。左栏中的“风速”卡片随后会显示那一天路线起点的预报。',
  'help.guide.tour-paddle-wind.result': '你可以逐小时了解当天下水点的风况。',
  'help.guide.tour-paddle-checklist.tip.1':
    '对每个障碍，选择你的做法：“划行通过”“搬运绕过”“绕行”或“不受影响”。“下一项”会带你到下一个未处理的条目。',
  'help.guide.tour-paddle-track-marks.step.1':
    '在“游览”标签页中，点击右侧栏的“添加行程”，选择“导入 GPX 或 KML”并选取文件。',
  'help.guide.tour-paddle-track-marks.tip.2': '“放弃”会丢弃你尚未保存的标记。录制的轨迹本身不会被重新绘制。',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK 不会计算骑行时间。如果想在当天显示时间，请在“详情”的“计划于”下输入一个时间。',
  'help.guide.tour-horse-plan.step.5': '在“路段”下选择一个路段。查看你骑行的“方向”，以及沿途的“马匹通行”是什么情况。',
  'help.guide.tour-horse-plan.tip.5':
    '骑马路线上的任何内容都不做路径规划：点击画出的线不会添加塑形点，路段两端的点保持在路线原来的位置。',
  'help.guide.tour-horse-gap.tip.1':
    '没有任何路径规划器或骑马路线检查过手动绘制的路段。请查看地图，了解它实际经过哪里。',
  'help.guide.tour-horse-recorded.step.4':
    '骑行记录会在左栏中打开。“已记录的骑马游”卡片显示“按记录保留”“无骑行时间”和“通行未经检查”。指向徽章可以看到原因。',
  'help.guide.dateless-trip.step.2': '“开始日期”和“结束日期”留空。它们下方会出现“天数”字段：输入你想规划的天数。',
  'help.guide.trip-reminder.tip.1':
    '只有旅行所有者（或管理员）能看到“提醒”区块。如果它是灰色的，需要管理员先在“管理”的“通知”中开启旅行提醒。',
  'help.guide.upcoming-reservations.step.2': '点击一条预订，即可打开它所属的旅行。',
  'help.guide.timezones-widget.tip.1':
    '列表使用官方时区名称，例如 Europe/Lisbon 或 America/New_York，所以请搜索名称里的城市。',
  'help.guide.half-company-holiday.step.2': '在同一工具栏中打开“半天”。',
  'help.guide.edit-holiday-calendar.tip.1': '每次修改都会立即保存，没有“保存”按钮。',
  'help.guide.person-color.tip.1': '工具栏和“年假额度”卡片中会用同一种颜色标记这位成员。',
  'help.guide.answer-fusion-request.step.2':
    '看一下合并是什么意思：共用一个日历，可以互相编辑对方的条目，并共用假日设置。',
  'help.guide.log-for-partner.step.2': '看一下工具栏：它的第一个按钮现在显示的是对方的名字和颜色。',
  'help.guide.dissolve-fusion.step.2': '在底部的“解除合并”下，点击“解除”。',
  'help.guide.country-places.step.3':
    '对话框按旅行分组，列出该国家下计入的所有地点；超过六个时，顶部的“搜索地点”可以缩小列表。点击地点或旅行标题，即可在规划器中打开该旅行。',
  'help.guide.tour-activity-stats.step.5':
    '点击“查看游览”。“我的游览记录”会打开，显示合计、“按类型”的分布，以及该时段内的每条路线，包括日期、所属旅行、距离和爬升。标题栏上的标签在这里同样可以切换时段和类型。',
  'help.guide.move-to-list.step.3': '选择要放入的列表。列表超过三个时，顶部的搜索框可以缩小范围。',
  'help.guide.accept-list-invite.goal': '加入别人与你共享的列表，或拒绝邀请。',
  'help.guide.tour-collection-add-to-trip.step.4': '如有需要，修改“在行程中的名称”，然后点击“添加到行程”。',
  'help.guide.tour-collection-manage.step.2': '在“搜索地点”中输入内容。它会按名称同时筛选路线和地点。',
  'help.guide.create-journey.tip.3':
    '旅行刚结束时，顶部“旅行刚结束”横幅中的“创建旅程”会直接以该旅行为已选状态开始创建。',
  'help.guide.entry-draft.step.2': '点击“保存”。卡片上现在带有“草稿”徽章。',
  'help.guide.gallery-map.step.3':
    '回到“时间线”，右侧的地图会随你滚动而变化：当前可见的条目会以当天的颜色圈出。点击图钉，时间线会滚动到对应的条目。',
  'help.guide.journey-map-layers.tip.1': '彩色虚线是旅行的 GPX 路线，属于计划的一部分；实线是当天录制的路线。',
  'help.guide.journey-keep-route.tip.1': '录制在哪里停止，线条就在哪里结束。TREK 只画录制下来的部分。',
  'help.guide.journey-day-stays.tip.1':
    '只有可以编辑日志、并连接了自己 Dawarich 的人才会看到这一行，而且只会出现在仍有待决定内容的日子。',
  'help.guide.journey-take-over-day.step.4':
    '如果也想保留路线，就让“同时保存当天的路线”保持开启，然后点击“引入”按钮。按钮上会显示将创建多少个草稿。',
  'help.guide.journey-auto-prepare.step.3':
    '下面一行会说明你的停留记录上次获取的时间，或失败的原因。点击“立即获取”，会马上向 Dawarich 请求。',
  'help.guide.photo-location.tip.1': '你自己设置的地点永远不会被改动。',
  'help.ctx.settings-plugins.bullet.1':
    '“插件设置”：其下方是每个需要你填写内容的插件各一张卡片，带有字段和“保存”。密钥字段保存后不会再显示。',
  'help.guide.dashboard-widgets.step.3': '卡片下方的“恢复默认”会把整个“外观”标签页恢复为初始设置。',
  'help.guide.web-push-device.result': '卡片显示“已为此设备开启”，在“推送”下开启的事件，即使 TREK 没有打开也会送达。',
  'help.guide.connect-airtrail.step.1':
    '在“集成”下找到 AirTrail，输入它的“实例 URL”和一个 API 密钥。密钥在 AirTrail 的“设置”、“安全”中创建。',
  'help.guide.connect-dawarich.step.1':
    '在“集成”下找到 Dawarich，输入它的“实例地址”，以及在 Dawarich 的“账户”、“API 密钥”中获取的 API 密钥。',
  'help.guide.tour-connect-wanderer.step.1':
    '在“集成”下找到 wanderer，输入它的“实例 URL”和一个 API 令牌。令牌在 wanderer 的“设置”、“账户”、“API 令牌”中创建，以 wanderer_key_ 开头。',
  'help.guide.tour-wanderer-watch.goal': '让 TREK 在后台检查你导入的路线有没有变化。',
  'help.guide.mcp-oauth.tip.3': '“API 令牌”仍然可用，但被标记为“已弃用”，请改用 OAuth 客户端。',
  'help.guide.offline-conflicts.tip.2': '这个选择只对这台设备有效。',
  'help.guide.default-user-settings.tip.1': '用户在“设置”中自己的选择始终优先；这些默认值适用于所有没改过该设置的人。',
  'help.guide.own-routing-engine.step.1':
    '在“用户默认设置”的“地图”下，于“自建路径规划服务”中输入你的 OSRM 服务器地址。',
  'help.guide.admin-passkeys.tip.2': '如果之后更改了域名，用户已添加的所有通行密钥都会失效。',
  'help.guide.instance-keys.tip.4': '高德地图的密钥必须是 Web 服务 (web service) 密钥，不能是 JS API 密钥。',
  'help.guide.rotate-jwt-secret.step.2': '阅读警告，然后点击“轮换并退出登录”。',
  'help.guide.notification-defaults.tip.2': '默认值只对自己没有改过该单元格的用户生效。',
  'help.ctx.notifications.bullet.5':
    '哪些事件在这里通知你，哪些通过邮件、webhook、ntfy 或推送通知你，在“设置”的“通知”中选择。',
  'help.guide.read-notifications.result': '你会来到该通知所涉及的页面，铃铛上的数字减 1。',
  'help.guide.mark-notifications-read.title': '把通知标为已读',
  'help.guide.delete-notifications.goal': '删掉不再需要的通知，让列表保持简短。',
  'help.guide.notification-settings.step.1': '点击右上角你的名字。',
  'help.guide.public-link.step.5': '链接有效期间，你可以随时修改这些选项。“删除链接”会让链接失效。',
  'help.guide.link-journal.step.3':
    '为旅行中的每个人选择“无权限”“阅读”或“编辑”。“全部可读”和“无人”可以一次性全部设置。',
  'help.guide.collapse-columns.tip.3': '分隔条获得焦点后，也可以用方向键移动它。',
  'help.guide.edit-place.tip.3':
    '如果点到了对话框外面，你的修改也不会丢：TREK 会先问“放弃更改？”，点“继续编辑”就回到表单。',
  'help.guide.dawarich-stays.goal': '把 Dawarich 记录到的你在旅行期间的停留地点逐一核对后，添加为地点。',
  'help.guide.leave-stop-off-route.step.1': '右键点击该站点，或点击它的三个点，选择“从路线中排除”。',
  'help.guide.move-booking-day.step.3': '这一行现在出现在新的日期，保持它自己的时间。如果时间也要改，请打开这个预订。',
  'help.guide.place-image-from-file.goal': '把地点文件里已有的一张照片设为它的图片，不用重新上传。',
  'help.guide.place-image-from-file.tip.3': '只有有权修改地点的旅伴才能更换图片。',
  'help.guide.place-own-hours.result':
    '卡片显示你填的电话、电子邮件和营业时间，图片周围的圆环按你填的营业时间显示为绿色或红色。',
  'help.guide.confirm-stay-booking.step.4': '点击预订右上角的 X 关闭它。在“预订”下，住宿卡片现在显示“已确认”。',
  'help.guide.tour-map-lines.title': '在地图上找到你的路线',
  'help.guide.tour-map-lines.tip.2':
    '隐藏只对你自己有效，并保存在这个浏览器里、仅针对这个旅行：路线、它的日期和颜色对其他人都不变。“游览”列表上方的“全部显示”会把所有隐藏的路线重新显示，手机上的地图则始终显示所有路线。',
  'help.guide.car-stops.step.4':
    '在“沿途停靠点”下，车经过的每个地点都点击“添加经停”并选择该地点，也可以在旁边填写时间。没有选地点的经停，保存时会被丢弃。',
  'help.guide.transport-details.step.2':
    '标题中的标签显示状态、类型、日期和“预订码”。点击状态标签，可以在“待确认”和“已确认”之间切换。预订码标签里的小复制图标即“复制预订码”，会把预订码复制到剪贴板，方便你在值机柜台出示。',
  'help.guide.group-sort-bookings.step.3':
    '在“排序方式”下选择“日期”“标题”“类型”或“状态”。其下方的一行可以翻转顺序：日期是“最早的在前”或“最晚的在前”，其他是“按名称”或“Z 到 A”。',
  'help.guide.booking-on-map.title': '在地图上找到预订',
  'help.guide.export-bookings-csv.tip.1':
    '各列依次为类型、标题、状态、开始、结束、出发地、到达地、地点、确认号和笔记。',
  'help.guide.arrange-packing-list.tip.1': '开启“按名称”排序时，物品不能拖动，但整个清单仍然可以拖动。',
  'help.guide.count-packed-pieces.step.3':
    '只打包了一部分时，计数器使用你的强调色，勾选框也带有同色轮廓。点击减号可以从计数中减去一件。',
  'help.guide.expense-receipts.step.5':
    '预览显示收据，顶部有“在新标签页中打开”和“下载”。有多张收据时，可以用方向键在它们之间切换，按 Esc 键关闭预览。',
  'help.guide.files-sync-settings.step.3': '点击流程栏下方的“设置”，显示其余选项。',
  'help.guide.manage-notes.step.3':
    '同一菜单中的“置顶”会让笔记固定在面板顶部，加上分类颜色的边框，标题旁有图钉。同一位置的“取消置顶”会让笔记回到原来的位置。',
  'help.guide.note-categories.step.1':
    '点击“笔记”卡片标题中“新建笔记”旁边的齿轮。“管理分类”会打开，每个分类一行：颜色、名称、六个颜色圆点和一个垃圾桶。',
  'help.guide.note-categories.tip.2':
    '还没有笔记的分类只保存在你的浏览器里。其他成员要等到有笔记归入该分类后才能看到。',
  'help.guide.roadtrip-reorder.goal': '直接在导轨中调整行程顺序，或把站点移到另一天。',
  'help.guide.roadtrip-overnight.step.4':
    '旁边的“查找住宿”会给出可复制的名称，以及订房网站的链接：酒店用 trivago 或 CHECK24，露营地用 PiNCAMP 或 Pitchup。请在网站上核对地点、日期和人数。',
  'help.guide.roadtrip-stop-fill.step.2':
    '在“加到”下选择 50 到 100。按钮下方的一行会告诉你，加到这个量之后能从这里开多远。',
  'help.guide.roadtrip-bookings.step.2':
    '在导轨里，这段行程是一张按其类型着色的卡片，到达栏里显示时刻表，标题下方是它的起点和终点。',
  'help.guide.roadtrip-google-import.tip.1': 'TREK 会自己计算站点之间的路线，不会照搬 Google 的道路。',
  'help.guide.roadtrip-hazards.result': '地图上会显示你旅行沿线的当前警告，路线本身不会变。',
  'help.ctx.trip-tours.bullet.3':
    '每一行：彩色条是路线在地图上的线，圆形图块显示路线限制（T1 到 T6）或类型，小小的 GPX 或 wanderer 徽章表示这是导入的，其他徽章给出日期、用时、距离和爬升。带数字的月亮图标表示多日路线的阶段数。',
  'help.guide.tour-show-list.step.3': '点击一行。路线的卡片会在地图上方打开。',
  'help.guide.tour-add-to-day.goal': '规划哪天走哪条路线，让它出现在当天的计划里，并在地图上显示线路。',
  'help.guide.tour-add-to-day.tip.3':
    '一条路线在同一天只能添加一次。如果把它拖到已经有它的那一天，TREK 只会提示“此游览路线已在那一天。”',
  'help.guide.tour-day-times.step.4':
    '如果路线在当天下一项开始之后才结束，该行下方会有一行提示，例如“13:30 结束，晚于 12:30 开始的 Lunch at Gostner Schwaige”。不会移动任何内容。',
  'help.guide.tour-remove-from-day.step.1': '在日期栏中，指向这条路线所在的行，点击“更多选项”，选择“从当天移除”。',
  'help.guide.tour-filter-list.step.1':
    '点击“导入 GPX 或 KML”下方的筛选按钮。它会显示当前筛选的状态，起初是“全部”，旁边是路线数量。',
  'help.guide.tour-hide-on-map.title': '在地图上隐藏路线的线条',
  'help.guide.tour-import-plan-tab.title': '从“计划”标签页导入轨迹',
  'help.ctx.trip-tour-detail.title': '路线详情',
  'help.guide.tour-detail-read.goal': '查看旅行中关于一条路线的全部信息：日期、距离和高度、剖面以及来源。',
  'help.guide.tour-detail-read.tip.1':
    '琥珀色的“谨慎使用”标签表示导入的数据中高度或测量值不完整。看爬升和剖面时请记住这一点。',
  'help.guide.tour-rename-colour.step.1': '打开路线的卡片，点击名称旁的铅笔图标。名称会变成输入框。',
  'help.guide.tour-take-along.goal': '导航到路线起点，在网页上打开路线页面，或把路线下载为 GPX 文件。',
  'help.guide.tour-take-along.result': '你的地图应用里有了前往起点的导航，同时也有了整条路线的 GPX 文件。',
  'help.guide.tour-copy-keep.tip.2':
    '当天计划中路线菜单里的“保存到收藏”会打开同一个对话框，所以路线也会一并保存到那里。',
  'help.guide.tour-packing-link.step.3': '点击“链接”。',
  'help.guide.tour-files.goal': '把预订单、地图或路线说明附加到路线上，以后可以从路线卡片再次打开。',
  'help.guide.tour-activity-link.goal': '把录制的 GPX 轨迹关联到计划好的路线上，而不改动计划。',
  'help.guide.tour-activity-link.tip.3': '“用时”从轨迹的第一个时间戳算到最后一个，包含休息。',
  'help.guide.tour-activity-compare.tip.1': '“在地图上比较”只在卡片显示在地图旁边时才有，手机上没有。',
  'help.guide.tour-origin-check.tip.1': '从其他行程引入的路线，会在“引入自”下写明那个旅行和路线。',
  'help.ctx.trip-tour-planner.bullet.3':
    '“本次旅行的游览活动”是右侧导轨，列出每条路线，列表上方有筛选和“行程汇总”。打开某条路线时，顶部的“游览概览”会给出它的距离、爬升、用时和海拔剖面。顶部的加号即“添加行程”，用来规划、导入或引入路线。',
  'help.guide.tour-open-workspace.step.3':
    '右侧导轨“本次旅行的游览活动”列出旅行的每条路线，列表上方有筛选和“行程汇总”。',
  'help.guide.tour-open-workspace.result': '“游览”标签页：左侧是编辑器，右侧是旅行的路线，中间是地图。',
  'help.guide.tour-draw-route.step.6':
    '在“路点”下，每个点都有一行，带有编号，地名加载完成后会以地名命名。TREK 处理时，“新游览路线”旁的小圆点会显示当前状态。',
  'help.guide.tour-type-profile.step.1':
    '点击“游览名称”下的“路线类型”。它会显示当前类型，以及一行说明这类路线是如何规划的。',
  'help.guide.tour-edit-points.goal': '在地图上或列表中移动路线的点，改变路线的走向。',
  'help.guide.tour-edit-points.tip.2': '地名加载完成之前，一行显示的是坐标。撤销和重做没有键盘快捷键。',
  'help.guide.tour-shaping-points.tip.1': '起点和终点始终是站点。',
  'help.guide.tour-loop-reverse.step.3': '点击旁边的“反转方向”，整条路线就会反方向走。',
  'help.guide.tour-leg-by-hand.step.2': '这一段会变成一条虚线直线，列表中该行下方显示“手动绘制，未规划”以及它的长度。',
  'help.guide.tour-trip-places.step.1': '点击“路点”下“添加地点”旁边的“行程地点”。旅行的地点会在其下方展开。',
  'help.guide.tour-details-times.title': '给路线命名并规划时间',
  'help.guide.tour-details-times.tip.3':
    '点击“详情”旁的箭头可以折叠它。当其中某个字段的值不被“保存”接受时，它会自动展开。',
  'help.guide.tour-save.tip.1': '“保存”旁边的“放弃”在确认后会丢弃未保存的更改，不会改动已保存的路线。',
  'help.guide.tour-edit-saved.step.3': '点击“保存”。会出现“游览路线已保存”，路线保留它的日期、文件和笔记。',
  'help.guide.tour-summary-profile.step.1':
    '“本次旅行的游览活动”顶部的“游览概览”给出编辑器中那条路线的距离、“累计爬升”和“累计下降”，以及估算用时、休息和计划总用时。',
  'help.guide.tour-list-manage.title': '管理旅行中的路线',
  'help.guide.tour-list-manage.tip.2':
    '已经有这条路线的日期，在日期菜单中会变灰。对于多日路线，TREK 会问你是从那一天起安排各个阶段，还是把整条路线放在那一天。',
  'help.guide.tour-delete.tip.2': '如果只想把它从某一天移走，请改用该天菜单中的“从当天移除”。',
  'help.guide.tour-saved-elsewhere.step.4':
    '选择“另存为新路线”可以两个版本都保留，“加载较新版本”会改用另一个版本，“覆盖”则用你的版本替换另一个版本。',
  'help.ctx.trip-tour-import.bullet.3':
    '导入的内容会作为“GPX 游览路线”或“wanderer 游览路线”打开：线路、“游览概览”和海拔剖面都与导入时一致。它在列表中的行带有“GPX 导入”徽章。',
  'help.guide.tour-import-gpx.step.4':
    '在“导入为”下，确认这些轨迹是什么。默认是“徒步”。“骑行”或“跑步”需要选择配置，“划桨游”需要选择船和水域，“滑雪与冬季”需要选择滑雪项目。',
  'help.guide.tour-view-import.title': '查看导入的轨迹',
  'help.guide.tour-view-import.result': '你看到的是导入时的原样录制轨迹，没有重新计算任何内容。',
  'help.guide.tour-plan-from-import.tip.2':
    '如果卡片提示这个建议在较长的路段上偏离了轨迹，先在地图上检查这些部分，再据此规划。',
  'help.guide.tour-restore-recorded.step.3': '点击“恢复录制的轨迹”确认。路点和规划出的线路会被删除，日期和笔记保留。',
  'help.guide.tour-take-over.step.3': '找到那条路线：在“按名称搜索”中输入，或用“行程”和“类型”筛选缩小列表。',
  'help.guide.tour-import-wanderer.title': '从 wanderer 导入路线',
  'help.guide.tour-import-wanderer.tip.3':
    '已在旅行中的路线会标为“已在此旅行中”，并提供“打开游览路线”。导入后又有变化的路线，会在旧版本旁提供“作为新版本导入”。',
  'help.ctx.trip-tour-map.bullet.4':
    '左侧面板中的“沿途”卡片会搜索路线附近的观景点、水源、山屋、餐饮等，并列出结果。列表中的地点可以作为站点加入路线。',
  'help.guide.tour-map-layers.tip.1':
    '你选的地图会对你之后打开的每条路线保持有效，直到刷新页面。类型不支持该地图的路线会用“地图”打开，“计划”标签页中的地图和“设置”里的设定都不变。',
  'help.guide.tour-along-search.step.4': '点击“沿途搜索”。TREK 只是查找，路线本身不会有任何改动。',
  'help.guide.tour-along-add-stop.step.1':
    '点击“沿途”列表中的一个地点，或地图上它的图钉。它的卡片会在地图上方打开：它是什么、离路线多远，以及位于路线的多远处。',
  'help.guide.tour-3d-terrain.title': '以 3D 查看路线',
  'help.guide.tour-3d-terrain.tip.1': '同一行中的“概览”会在你移动视图之后，重新显示整条路线。',
  'help.guide.tour-3d-flyover.step.4': '点击“概览”，重新显示整条路线。',
  'help.guide.tour-map-overlays.step.2': '点击“雪道图例”，即开关旁边由彩色圆点组成的小方块。',
  'help.ctx.trip-tour-stages.summary':
    '多日路线是被分成若干阶段的一条路线，每个赶路的日子一个阶段。在这里你可以设置每天在哪里结束，查看每个阶段的各项数据，并把各阶段安排到旅行的日期上。',
  'help.guide.tour-multi-day.step.1': '在“本次旅行的游览活动”中，点击这条路线，在编辑器中打开它。',
  'help.guide.tour-multi-day.tip.3': '阶段的用时不含休息。以警告色显示的用时，即“移动时间超过一天”，表示超过了一天。',
  'help.guide.tour-stages-on-days.step.4': '点击带月亮图标和阶段数的按钮，即“显示阶段”，把阶段展开。',
  'help.ctx.trip-tour-hike.title': '徒步与跑步',
  'help.guide.tour-hike-plan.title': '在你设定的难度范围内规划徒步',
  'help.guide.tour-hike-plan.result':
    '徒步路线会列在“本次旅行的游览活动”下，带有距离、爬升和步行用时，随时可以安排到某一天。',
  'help.guide.tour-hike-trail-details.step.2':
    '选择要显示的内容：表示徒步等级的 SAC、“路面”或“道路类型”。地图上的路线使用与列表相同的颜色。',
  'help.guide.tour-hike-round.title': '寻找大约指定长度的环线徒步',
  'help.guide.tour-hike-round.tip.1': '环线不会超出这条徒步路线的“步道最高难度”；卡片中的 T 标签会显示是哪一级。',
  'help.guide.tour-hike-compare-ways.step.4': '点击“采用这条道路”。TREK 会用路径规划器核实路线确实沿着这条路走。',
  'help.guide.tour-ferrata-add.step.2':
    '在地图上点击一条飞拉达，点它的虚线或标志牌都可以。卡片会显示名称、难度和长度。',
  'help.guide.tour-ferrata-add.tip.4':
    '卡片上的“在 OpenStreetMap 中查看”会打开这条飞拉达自己的数据。什么都加载不出来时，徽章会变成琥珀色，原因写在悬停提示里。',
  'help.guide.tour-run-plan.result':
    '这次跑步会列在“本次旅行的游览活动”下，带有“跑步时间（计划）”，它的配置和配速也会一并保存。',
  'help.guide.tour-run-ways.step.2': '卡片顶部现在显示这次跑步有多少是未铺装路面，以及路线上难度最高的小径。',
  'help.ctx.trip-tour-walk.bullet.2':
    '“路点”按顺序列出站点。站点编号外的圆环表示“必去”（实线）或“可选”（虚线），小盾牌表示“受保护”，名称下方的标签显示停留多久。',
  'help.guide.tour-walk-plan.step.3': '在“路点”中指向一个站点，点击它旁边的“更多操作”，选择“编辑站点”。',
  'help.guide.tour-walk-sights.title': '在城市漫步沿途添加景点',
  'help.guide.tour-walk-sights.tip.2': '更改路线后，按钮会变成“重新搜索”，因为已找到的地点是针对旧路线的。',
  'help.guide.tour-walk-day-times.step.4':
    '在每个站点下，你可以看到到达时间和停留多久。如果某个地点在那个时间已关门，或在停留期间关门，会出现警告。',
  'help.guide.tour-walk-google-import.step.1':
    '在“本次旅行的游览活动”中，点击“添加行程”（顶部的 +），选择“从 Google Maps 导入漫步”。',
  'help.guide.tour-walk-check-off.title': '在当天勾掉漫步的站点',
  'help.guide.tour-walk-check-off.tip.3': '如果你离线时把漫步安排到某一天，要等同步完成后才能勾选。',
  'help.guide.tour-bike-profile.title': '按你的骑行方式规划骑行路线',
  'help.guide.tour-bike-profile.result':
    '骑行路线已保存，并列在“本次旅行的游览活动”下，按所选配置规划了路径，骑行用时显示在“游览概览”中。',
  'help.guide.tour-bike-surfaces.step.1':
    '在右侧的“本次旅行的游览活动”中，点击一条骑行路线打开它。路线计算完成后，“路面与道路”卡片会出现在“路点”下方。',
  'help.guide.tour-bike-surfaces.tip.4': '点击卡片标题可以折叠它。刷新后，它在这个浏览器里仍保持折叠。',
  'help.guide.tour-bike-mtb-grades.tip.2':
    '如果地图贡献者标注了上坡路段的难度，下方会接着显示“上坡难度（mtb:scale:uphill）”，并有各自的行。',
  'help.ctx.trip-tour-ski.bullet.4':
    '“路点”下方的“雪道路线”卡片把一天分成“滑行”“乘缆车”“等待”和“步行”，并给出雪道长度、在雪道上滑下的高度和缆车次数。每一段都规划完成后，右侧“游览概览”中的“滑雪用时”会把这些加总。',
  'help.guide.tour-ski-plan.step.5':
    '每个点下方，它的路段以标签列出：每条雪道、缆车和步行路段，按名称或类型显示，雪道带有按难度着色的圆点，还有各自的分钟数。',
  'help.guide.tour-ski-options.goal': '设置最难的雪道、偏好、你的速度以及乘坐哪些缆车，让各个路段适合你。',
  'help.guide.tour-ski-options.tip.3':
    '“避开推测的连接”会让路线绕开地图数据只是推测出来的连接，例如两条雪道之间没有标注的一段。',
  'help.guide.tour-ski-fix-leg.tip.2': '某个区域的雪道数据还在下载时，规划器会等待并自动重试。',
  'help.guide.tour-ski-summary.step.3':
    '在右侧的“游览概览”中，“滑雪用时”把所有这些加总。旁边的信息圆点会说明计算方式。',
  'help.guide.tour-ski-pistes-layer.step.1':
    '打开“滑雪与冬季”路线时，地图会自动显示雪道。地图左下角一排按钮中的雪山开关可以隐藏和重新显示它们，悬停提示是“雪道、越野滑雪道和缆车”。',
  'help.guide.tour-ski-import.goal': '导入录制的滑雪、越野滑雪或雪鞋徒步轨迹，并为它指定正确的项目。',
  'help.guide.tour-ski-import.tip.2':
    '如果想像编辑规划好的路线那样编辑它，请使用“可编辑版本”卡片中的“规划可编辑版本”。它的点之间用直线连接。',
  'help.ctx.trip-tour-paddle.bullet.4':
    '“用时估算”会把水上用时、搬运船只、上岸与重新下水、船闸和休息加总，依据的速度和分钟数你都可以修改。',
  'help.guide.tour-paddle-setup.step.4': '在“水域”下选择“河流”或“湖泊”。船和水域类型都选好之前，无法保存路线。',
  'help.guide.tour-paddle-setup.result': '一条新的划桨路线，已设好船、水域和速度，可以在地图上添加第一个点了。',
  'help.guide.tour-paddle-water-route.tip.1':
    '水域数据缺失时，TREK 会根据实例的配置，自动下载该区域的数据，或向管理员申请。这一段随后会显示“正在加载水域数据”，数据就绪后自动规划，通常在一到三分钟内。',
  'help.guide.tour-paddle-portage.step.2': '选择“从这里开始陆上搬运”。到下一个点的这一段会变成陆上搬运，画在陆地上。',
  'help.guide.tour-paddle-lock.title': '添加船闸及其等待时间',
  'help.guide.tour-paddle-lock.tip.3': '“移除船闸”位于打开的卡片底部，也在“更多操作”中。',
  'help.guide.tour-paddle-time.step.5': '在每个船闸都填好时间之前，估算会显示“不完整”，行下方的备注会列出缺少的内容。',
  'help.guide.tour-paddle-wind.step.2':
    '查看风向、“平均”和“阵风”。“平均”是当天最大的每小时平均风速，“阵风”是最强的一阵风。',
  'help.guide.tour-paddle-checklist.title': '逐项检查障碍清单',
  'help.guide.tour-paddle-checklist.tip.2': '“搬运绕过”不会自动规划陆上搬运。点击“规划陆上搬运”，在地图上设置它。',
  'help.guide.tour-paddle-track-marks.step.2':
    '在“导入预览”中，把“导入为”设为“划桨游”，然后选择“船”和“水域”。两者都选好之前，导入无法继续。',
  'help.guide.tour-paddle-track-marks.tip.3':
    '对于录制的轨迹，“用时估算”中的“水域”一行有自己的速度：点击它，输入你实际划桨的速度。',
  'help.ctx.trip-tour-horse.bullet.5':
    '从 GPX 文件导入的骑行会保持录制时的样子，它的“已记录的骑马游”卡片会说明导入时哪些内容无法计算。',
  'help.guide.tour-horse-plan.step.6':
    '点击“采用路段”。该路段会以带有路线名称的徽章，加入“路点”卡片中的骑行。用同样的方法再添加更多路段。',
  'help.guide.tour-horse-gap.title': '衔接马道之间的空缺',
  'help.guide.tour-horse-gap.tip.2': '你在地图上点击的点，也会以同样的方式加入骑行，成为未经检查的直线路段。',
  'help.guide.tour-horse-recorded.result': '这次骑行会按你骑行时的样子保存在旅行中，距离和高度来自文件。',
  'help.guide.dateless-trip.step.3': '点击“创建新旅行”。',
  'help.guide.trip-reminder.tip.2': '新旅行默认在出发前 3 天提醒。通过哪些渠道通知你，在“设置”的“通知”中选择。',
  'help.guide.upcoming-reservations.result': '旅行随即打开。回到仪表盘后，小组件会继续显示接下来的安排。',
  'help.guide.entitlement.tip.2': '在合并后的计划中，每个人都有自己的一行，你也可以设置其他人的年假额度。',
  'help.guide.half-company-holiday.step.3': '点击那一天。单元格的一半会变成琥珀色。',
  'help.guide.school-holidays.tip.2': '把鼠标移到假期中的某一天，可以在“学校假期”下看到这个假期的名称。',
  'help.guide.answer-fusion-request.step.3': '点击“接受并合并”合并计划，或点击“拒绝”保持各自独立的计划。',
  'help.guide.log-for-partner.step.3': '点击要登记的日子，然后再次点击“人数”中你自己的名字。',
  'help.guide.dissolve-fusion.result': '每个人都回到自己的计划和自己的条目，“人数”里只剩你一个人。',
  'help.guide.country-places.result': '规划器会打开该地点所属的旅行。',
  'help.guide.tour-activity-stats.step.6':
    '对于没有成行的路线，点击其行末的圆形按钮“排除”。路线仍留在列表中，显示为暗色并标为“已排除”。同一个按钮此时是“重新计入”，点击即可把它加回来。',
  'help.guide.move-to-list.tip.1': '标签属于某一个列表，所以移动或复制过去的地点，在新列表中不带标签。',
  'help.guide.accept-list-invite.step.1':
    '在列表栏的“邀请”下找到这个邀请。如果你是通过邀请通知进来的，卡片就在页面顶部。它会写明列表名称和邀请来自谁。',
  'help.guide.tour-collection-add-to-trip.tip.1':
    '新路线还没有安排到任何一天，也不会添加地点。列表和原路线都不会改变。',
  'help.guide.tour-collection-manage.step.3': '点击路线行末的垃圾桶，并点“从收藏中移除”确认。',
  'help.ctx.journey-detail.bullet.7':
    '连接 Dawarich 后，每日标题还会带有“导入记录”（或当天保存的路线距离）和“导入当天”。有待处理停留记录的日子，会把这些记录合并成当天末尾的一行。',
  'help.guide.entry-draft.tip.1': '贡献者仍然能看到草稿，只有公开链接会隐藏它，直到你关闭“草稿”。',
  'help.guide.journey-map-layers.tip.2':
    '变暗的开关表示暂时没有可显示的内容，悬停提示会说明原因。你的选择按旅程保存在这个浏览器里。',
  'help.guide.journey-keep-route.tip.2':
    '之后点击每日标题中的距离，可以再次与 Dawarich 比较：“替换”采用新版本，“移除路线”则把当天的路线从旅程中去掉。',
  'help.guide.journey-day-stays.tip.2': '遇到事情很多的一天，点行末的“导入当天”，可以一次处理当天所有的停留记录。',
  'help.guide.journey-take-over-day.tip.1':
    '点击该按钮之前不会保存任何内容，也不会重复保存：已在日志中的停留记录会被标出，无法再次选择。',
  'help.guide.journey-auto-prepare.tip.1': '只会准备已关联且有日期的旅行中的日子，也不会自动向日志添加任何内容。',
  'help.guide.photo-location.result': '没有地点的条目，会采用其第一张带 GPS 的照片的拍摄地点，并显示在地图上。',
  'help.guide.contributors.tip.2':
    '“通过旅行”列出的是通过已关联旅行获得权限的人。请在那个旅行的设置中修改他们的权限，不要在这里改。',
  'help.ctx.settings-plugins.bullet.2':
    '插件可以在自己的卡片里添加操作，你确认后才会运行；当插件代你登录其他服务时，还会有“连接”或“断开连接”。',
  'help.guide.web-push-device.tip.1':
    '推送按浏览器生效：想收到通知的每部手机和每台电脑都要各做一遍。“为此设备关闭”只会停止这台设备上的推送。',
  'help.guide.connect-airtrail.step.2':
    '“允许自签名证书”仅适用于你自己网络中可信的实例。“将更改写回 AirTrail”默认关闭，所以 TREK 只读取；打开后，你的修改会同步回 AirTrail。',
  'help.guide.connect-dawarich.step.2':
    '“自动检查新的停留记录”让 TREK 自动检查；关闭时，只有在你要求时才会读取 Dawarich。“允许自签名证书”仅适用于你的服务器不信任的实例。',
  'help.guide.tour-connect-wanderer.step.2': '只有实例在你自己的网络中时，才打开“允许自签名证书”。',
  'help.guide.tour-wanderer-watch.step.1': '在 wanderer 卡片中，打开“检查我的路线是否有变化”。需要先保存好连接。',
  'help.guide.plugin-settings.title': '为自己设置插件',
  'help.guide.default-user-settings.tip.2': '“显示货币”只是换算后显示金额，在“费用”中录入的金额保持不变。',
  'help.guide.own-routing-engine.step.2':
    '如果要让路线避开收费路段、高速公路或渡轮，在“自建 Valhalla 实例”下输入你的 Valhalla 地址。每个字段在你离开时自动保存；然后重启 TREK 服务器并刷新页面。',
  'help.guide.admin-passkeys.tip.3': '如果用户丢失了保存通行密钥的设备，可以在“编辑用户”中用“重置通行密钥”把它们移除。',
  'help.guide.rotate-jwt-secret.result': '新的签名密钥已生效，包括你在内的所有用户都必须重新登录。',
  'help.guide.read-notifications.title': '阅读你的通知',
  'help.guide.filter-notifications.title': '查看所有通知，或只看未读的',
  'help.guide.mark-notifications-read.goal': '看过新内容之后，去掉铃铛上的高亮和数字。',
  'help.guide.delete-notifications.step.1': '点击“删除”，即通知时间旁的垃圾桶，只删除这一条。',
  'help.guide.notification-settings.step.2': '在菜单中点击“设置”。',
  'help.guide.public-link.tip.3': '把鼠标移到某个选项上，可以看到它会隐藏什么内容。',
  'help.guide.link-journal.step.4': '阅读黄色提示：它会写明谁将第一次获得这本日志。然后点击“关联日志”。',
  'help.guide.dawarich-stays.step.1':
    '在“设置”的“集成”中连接 Dawarich 后，地点列表顶部会出现“来自 Dawarich”。它的标题说明 TREK 上次检查的时间以及有多少停留记录在等待。点击它即可打开列表。',
  'help.guide.leave-stop-off-route.step.2':
    '名称旁会出现“不在路线内”徽章。该站点仍留在当天和地图上，但当天的路线及各段时间会跳过它。',
  'help.guide.move-booking-day.result': '在计划中，这个预订属于新的那一天，时间保持不变。',
  'help.guide.clear-day.tip.2': '这个菜单项只在有地点的日子里出现。',
  'help.guide.place-image-from-file.step.1':
    '打开一个“文件”中有照片的地点。卡片底部附近的“文件”区块会显示该地点有多少个文件。',
  'help.guide.place-own-hours.title': '更正地点的营业时间、电话或电子邮件',
  'help.guide.place-own-hours.tip.1':
    '你输入的时间会取代 TREK 查到的时间，所以有季节性营业时间的咖啡馆，也能显示你知道的实际情况。',
  'help.guide.day-panel.tip.3':
    '想按日历来规划？在“设置”的“显示”下打开“每日标题中日期在前”，标题就会以日期开头，下方是“第 1 天”或该天的名称。',
  'help.guide.confirm-stay-booking.result': '酒店预订已确认，住宿卡片和“预订”标签页上都是如此。',
  'help.guide.tour-map-lines.goal': '在地图上区分旅行中的各条路线，从线条打开某一条，并把暂时不需要的路线隐藏起来。',
  'help.guide.tour-map-lines.tip.3':
    '当天计划中路线行菜单里的“从路线中排除”，会让当天的路线不再通向这条游览路线的起点和终点；“重新加入路线”则把它们重新接上。',
  'help.guide.car-stops.step.5':
    '经停的顺序就是路线的顺序。经停左侧的“上移”和“下移”可以调整顺序，右侧的叉号即“移除停靠点”，用来移除它。',
  'help.guide.transport-details.step.3':
    '下方的图块给出出发和到达，以及对应的车站或机场；设置后还有站台和座位。中间有经停的行程，会在“路线”下列出这些经停；逐段预订的行程，会在“各段预订码”下列出每一段的编码。随后是“出行人”“笔记”“费用”和“文件”；“在文件中显示”会在“文件”标签页中打开票据。',
  'help.guide.export-transports-csv.title': '把交通导出为电子表格',
  'help.guide.group-sort-bookings.step.4': '点击分区标题可以折叠它。旁边的数字表示其中有多少预订，再点一次即可展开。',
  'help.guide.booking-on-map.goal': '从预订直接跳到它在计划和地图上的地点。',
  'help.guide.export-bookings-csv.tip.2': '各列用分号分隔，用 Excel 打开文件时重音符号不会乱码。',
  'help.guide.arrange-packing-list.tip.2':
    'TREK 会在这个浏览器里记住“按名称”，所以下次打开时清单同样是排好序的。它只改变你看到的顺序，不会改变其他人看到的顺序。',
  'help.guide.count-packed-pieces.step.4': '计数器达到数量后，该物品会自动勾选，并计为已打包。',
  'help.guide.expense-receipts.result': '收据随支出一起保存：点击该行上的标签即可打开，文件也在旅行的“文件”中。',
  'help.guide.files-sync-settings.step.4':
    '在“当文档被删除时”下，选择另一侧的副本如何处理。“两份副本都保留”会让文档服务中的副本留在原处。“移入回收站”则会在你于 TREK 中删除文档时，把它送到文档服务的回收站。',
  'help.ctx.trip-collab.bullet.7':
    '这里的一切操作都需要联网。离线时，消息、笔记、链接、投票或表决都不会保存，TREK 会提示“此操作需要网络连接”。TREK 重新联网后请再试一次。无权编辑“协作”的成员可以阅读所有内容，但看不到“新建笔记”“添加链接”和“新建投票”，消息框也是灰色的。',
  'help.guide.manage-notes.step.4':
    '“编辑”会打开已填好所有内容的笔记对话框。修改你需要的内容，这里是在“内容”下再加一行，然后点击“保存”。',
  'help.guide.note-categories.step.2':
    '在底部的“新建分类...”中输入名称，按回车键或点击旁边的加号。新分类会获得下一种颜色，并单独占一行。',
  'help.guide.note-categories.tip.3': '在卡片上，分类只是标题中的一个彩色圆点。把鼠标移到圆点上可以看到分类名称。',
  'help.guide.roadtrip-reorder.step.1':
    '按住站点所在的行拖动，放到同一天的另一个站点上。它会占据那个站点的位置，当天按新的顺序重新规划路线。',
  'help.guide.roadtrip-overnight.step.5': '点击“添加”。从这一天到下一天订上一晚，该地点作为这一天的过夜点加入行程。',
  'help.guide.roadtrip-stop-fill.step.3': '要让这个站点重新使用你自己的设置，再次打开徽章并点击“使用我的默认值”。',
  'help.guide.roadtrip-bookings.step.3':
    '“入住”或“上车”标签说明行车最迟要在什么时候把你送到枢纽：出发时间会比时刻表提前那么久。',
  'help.guide.roadtrip-google-import.title': '从 Google 地图导入路线',
  'help.guide.roadtrip-google-import.tip.2': '链接里至少要有两个 TREK 能定位的站点，最多 30 个。',
  'help.guide.roadtrip-hazards.tip.1':
    '警告不是封路信息：路线绝不会因警告而改变，而且它们是当前的通告，不是针对你出行日期的预报。',
  'help.ctx.trip-tours.bullet.4':
    '把鼠标移到一行上，会出现它的眼睛图标（“在地图上隐藏”）和圆形 +（“添加到当天”）。把一行拖到左栏的某一天上，即可在那天规划它；点击它则会在地图上方打开路线的卡片。',
  'help.guide.tour-show-list.step.4':
    '卡片显示路线的各项数据，并在“旅行日期”下显示它所在的日期。要修改路线本身，请打开“游览”标签页，点击“本次旅行的游览活动”下的路线。',
  'help.guide.tour-add-to-day.step.1': '把鼠标移到列表中的路线上，点击其行右侧的圆形 +（“添加到当天”）。',
  'help.guide.tour-add-to-day.tip.4':
    '打开某一天（点击它的标题）后，路线的卡片里也有针对那一天的“添加到当天”。日期上方的撤销箭头可以取消这次安排。',
  'help.guide.tour-day-times.tip.1': '你输入的结束时间会取代推算出的结束时间。',
  'help.guide.tour-remove-from-day.step.2': '路线仍留在右侧的列表中。它的日期徽章消失了，筛选会把它重新计入“未规划”。',
  'help.guide.tour-filter-list.step.2':
    '在“状态”下，选择“未规划”查看尚未安排日期的路线，或选择“计划中”查看已安排日期的路线。每一行都会显示符合条件的路线数量。',
  'help.guide.tour-hide-on-map.goal': '把暂时不需要的路线从地图上隐藏，而不影响其他人看到的内容。',
  'help.guide.tour-import-plan-tab.goal': '规划日期的同时，把 GPX 或 KML 轨迹导入为路线。',
  'help.ctx.trip-tour-detail.summary':
    '在“计划”标签页选择一条路线时，在地图上方打开的卡片：显示路线的日期、各项数据和剖面、来源，以及把它发送到手机、复制、保存到收藏或关联到行李清单的按钮。',
  'help.guide.tour-detail-read.step.1':
    '在右栏顶部，从“地点”切换到“游览”，然后点击一条路线。它的卡片会在地图上方打开。点击它在某一天里的那一行，或它在地图上的线条，会打开同一张卡片。',
  'help.guide.tour-detail-read.tip.2': '划桨游不显示高度，也没有剖面：它的点位于河岸上，高度会不准确。',
  'help.guide.tour-rename-colour.step.2': '输入新名称，点击圆形的勾选按钮，或按回车键。按 Esc 键则保留旧名称。',
  'help.guide.tour-take-along.step.1':
    '打开路线的卡片。卡片底部的“导航”会在地图应用中打开路线的起点，有多个应用时会先列出这些应用。它带你到起点，而不是沿着路线走。',
  'help.guide.tour-copy-keep.title': '复制路线或把它保存到收藏',
  'help.guide.tour-copy-keep.tip.3':
    '在“游览”标签页中，左栏顶部的书签图标对当前打开的路线执行同样的操作。如果路线有未保存的更改，它会先要求你保存路线。',
  'help.guide.tour-packing-link.step.4':
    '卡片现在显示该清单、其中已打包多少物品、一条进度条和最前面的几件物品。已打包的物品带有删除线。',
  'help.guide.tour-files.step.1': '打开路线的卡片，滚动到末尾的“文件”。点击该区块标题中的“上传”，选择一个或多个文件。',
  'help.guide.tour-activity-link.step.1': '打开计划路线的卡片，滚动到“实际轨迹”。点击“添加实际轨迹”。',
  'help.guide.tour-activity-link.result': '轨迹已关联到路线，卡片并排显示计划和你实际走的情况。',
  'help.guide.tour-activity-compare.tip.2': '“足迹”中的游览记录会计入已关联的轨迹，而不是计划值。',
  'help.guide.tour-origin-check.tip.2':
    '来自 wanderer 的路线，在来源旁有一个箭头“在 wanderer 中打开”，区块标题中还有“检查来源”。检查时会向 wanderer 询问这条路线自导入以来是否有变化。之后点“作为新快照导入”，会把新版本作为单独的一条路线导入。这条路线本身保留它的日期和笔记。',
  'help.ctx.trip-tour-planner.bullet.4':
    '“添加地点”开启时（地图标签中的“放置点”），点击地图即可放置一个点。拖动图钉可以移动它，点击绘制出的路线可以在那里添加塑形点，用“行程地点”可以选择旅行中的某个地点。',
  'help.guide.tour-open-workspace.step.4':
    '右侧导轨顶部的加号，即“添加行程”，提供“导入 GPX 或 KML”“从 Google Maps 导入漫步”和“从其他行程引入路线”。打开某条路线时，“规划新游览路线”也在其中。',
  'help.guide.tour-draw-route.title': '绘制新路线',
  'help.guide.tour-draw-route.tip.1':
    '“放置点”开启时，鼠标指针是十字准线。关闭它，就可以拖动地图而不添加点。在 3D 中它默认关闭，因为在 3D 中拖动地图是为了转动视角。',
  'help.guide.tour-type-profile.step.2':
    '在列表中选择类型：“徒步”“城市漫步 / 观光”“跑步”“骑行”“划桨游”“骑马游”或“滑雪与冬季”。每个类型都会说明它规划什么，选择新类型会重新规划路线。',
  'help.guide.tour-edit-points.step.1': '把地图上带编号的图钉拖到点应该在的位置。路线会重新规划，经过新的位置。',
  'help.guide.tour-edit-points.result': '各个点位于你想要的位置，顺序也如你所愿，路线已重新规划。',
  'help.guide.tour-shaping-points.tip.2': '塑形点不能作为多日路线某个阶段的终点。',
  'help.guide.tour-loop-reverse.tip.1': '路线成为环线后，“返回起点”会提示“路线已返回起点”。',
  'help.guide.tour-leg-by-hand.step.3': '要让路径规划器重新规划这一段，打开同一个菜单并选择“重新规划下一段”。',
  'help.guide.tour-trip-places.step.2':
    '搜索旅行的地点，或者看“路线附近”：离路线两公里以内的地点，最近的在前，每个都带有距离。',
  'help.guide.tour-details-times.goal': '给路线添加名称、描述和链接，并把休息时间计入用时。',
  'help.guide.tour-details-times.result': '路线现在有了名称、笔记，以及你为它计划的时间。',
  'help.guide.tour-save.tip.2': '导轨顶部的“返回游览列表”会关闭编辑器，有未保存的更改时会先询问。',
  'help.guide.tour-edit-saved.step.4':
    '点击“返回游览列表”将其关闭。有未保存的更改时，会先询问“放弃游览路线中未保存的更改？”。',
  'help.guide.tour-summary-profile.step.2': '预计用时旁边的信息圆点会说明它是如何算出来的。',
  'help.guide.tour-list-manage.goal': '查看旅行中各条路线的合计，把某一条安排到某一天，并把列表缩小到你需要的内容。',
  'help.guide.tour-list-manage.tip.3':
    '行上的垃圾桶会删除路线。当“计划”标签页的右栏切换到“游览”时，列出的是同样的路线。',
  'help.guide.tour-delete.tip.3': '路线在这里的“游览”标签页中删除。只有可以编辑旅行地点的旅伴才有垃圾桶。',
  'help.guide.tour-saved-elsewhere.tip.1': '“另存为新路线”会把你的副本命名为原路线名称加上“(my version)”。',
  'help.ctx.trip-tour-import.bullet.4':
    '“可编辑版本”把导入的内容变成带有可移动路点的路线。“替换导入”保留录制的轨迹，编辑器中的“录制的轨迹”卡片可以带你回到它。',
  'help.guide.tour-import-gpx.step.5': '点击“导入 1 条路线”（如果文件有三条轨迹，则是“导入 3 条路线”）。',
  'help.guide.tour-view-import.goal': '查看导入路线导入时的线路、各项数据和海拔。',
  'help.guide.tour-plan-from-import.title': '根据导入的内容规划可编辑的路线',
  'help.guide.tour-plan-from-import.tip.3': '划桨或滑雪的导入，各点之间用直线连接，而不做路径规划。',
  'help.guide.tour-restore-recorded.tip.1': '只有用“替换导入”规划过并已保存的路线，才有这张卡片。',
  'help.guide.tour-take-over.step.4': '点击该路线。右侧显示它的线路、各项数据，以及它来自哪个旅行。',
  'help.guide.tour-import-wanderer.goal': '把你自己 wanderer 里的一条路线作为游览路线导入旅行。',
  'help.guide.tour-import-wanderer.tip.4': '“在 wanderer 中打开”会在你的实例上打开这条路线。',
  'help.ctx.trip-tour-map.bullet.5':
    '在 3D 中，路线铺在地形上，按坡度着色，有汇总各级坡度的图例，还有一个从起点飞到终点、跟随路线的飞越。',
  'help.guide.tour-map-layers.tip.2':
    '“徒步”和“骑行”来自志愿者服务器，只有管理员允许时才可用。其中一个不再响应时，它的分段会显示 !，你可以切换到另一张地图，你的路线保持不变。',
  'help.guide.tour-along-search.step.5':
    '找到的地点会列出它们离路线的距离，并以各自的颜色画在地图上。星标标出最知名的地点，“已在路线中”标出已经是站点的地点。按钮此时显示“重新搜索”。',
  'help.guide.tour-along-add-stop.step.2':
    '“插入位置”会建议最适合该地点的路段。点击它，可以改选插入到哪两个站点之间，或选择“作为新终点”。在任何改动生效之前，地图会用虚线显示新路线。',
  'help.guide.tour-3d-terrain.goal': '在真实的地貌上查看路线，并按坡度着色。',
  'help.guide.tour-3d-terrain.tip.2':
    '你选的地图在 3D 中同样适用，飞拉达、雪道和航标也是如此。编辑路线时，你可以在地形上拖动它的点，开启“放置点”后点击地形即可添加一个点。',
  'help.guide.tour-3d-flyover.result': '你已经以所选的速度，从空中把路线从起点到终点看了一遍。',
  'help.guide.tour-map-overlays.step.3':
    '图例说明各种颜色的含义：从“入门”到“野雪”的下坡雪道、“越野滑雪道”、“冬季徒步和雪鞋路线”、“雪橇道”，以及“缆车和索道”。点击“OpenSnowMap 上的完整图例”可查看所有符号。按 Esc 键关闭。',
  'help.ctx.trip-tour-stages.bullet.1':
    '编辑器中的“天数”让打开的路线成为“一日游”或“多日”路线。改回一日游时，所有阶段终点在你确认后被移除，路线保持不变。',
  'help.guide.tour-multi-day.step.2': '在“天数”下，点击“多日”。会有提示说明第一个阶段终点放在哪里。',
  'help.guide.tour-multi-day.tip.4':
    '点击“保存”后阶段才会保存。如果某个更改会去掉已安排在旅行某一天的阶段，会有提示说明保存后会把它从那一天移除。',
  'help.guide.tour-stages-on-days.step.5':
    '每个阶段都会显示它所在的日期。点击日期，可以把该阶段移到另一天，或选择“无日期”把它取下。',
  'help.ctx.trip-tour-hike.summary':
    '在“游览”标签页中打开的徒步或跑步：左侧是编辑器，中间是地图，右侧是路线概览和旅行的其他路线。徒步遵循你允许的步道难度，跑步按你自己的配速计时，两者都会显示 OpenStreetMap 在沿途记录的信息。',
  'help.guide.tour-hike-plan.goal': '开始一次徒步，设置站点，选择路线可以使用的最难步道等级，然后保存。',
  'help.guide.tour-hike-plan.tip.1':
    '新的徒步从 T2（“山地徒步”）开始。选择 T3 会出现警告，说明这类小路可能比较暴露，需要脚步稳健且不恐高。',
  'help.guide.tour-hike-trail-details.step.3':
    '徽章做出汇总：路线有多少是“已知”的、“已知最高”等级，以及单独列出的、规划这次徒步时用的“路线上限”。',
  'help.guide.tour-hike-round.goal': '让 TREK 从徒步的某个站点出发，推荐符合你想要长度的环线。',
  'help.guide.tour-hike-round.tip.2': '可输入 1 到 60 公里的距离，TREK 会提供与你输入的距离相差 20 % 以内的环线。',
  'help.guide.tour-hike-compare-ways.result':
    '只有那一段会改走你选的道路，徒步的其余部分保持原样。地图底部的“已采用道路”带有“撤销”。',
  'help.guide.tour-ferrata-add.step.3': '点击“加入行程”。飞拉达会作为单独的一段加在路线末尾，两端各有一个点。',
  'help.guide.tour-run-plan.title': '按你自己的配速规划跑步',
  'help.guide.tour-run-plan.tip.1': '没有配速，跑步就无法保存。',
  'help.guide.tour-run-ways.step.3': '点击“路面”，再在列表中选一种路面，地图上就只画出这类路段。',
  'help.ctx.trip-tour-walk.bullet.3':
    '漫步安排到有开始时间的某一天后，“路点”顶部的“时间依据”会写明那一天，每个站点显示到达时间、停留时间，以及营业时间的相关信息。',
  'help.guide.tour-walk-plan.step.4':
    '给站点设置“标签”和“停留时间（分钟）”。还不知道停留多久时就留空，对只是路过的点填 0。',
  'help.guide.tour-walk-sights.goal': '选一个主题，沿漫步路线搜索，并把某个地点添加为站点。',
  'help.guide.tour-walk-sights.tip.3': '营业时间和网站来自数据源，主要是 OpenStreetMap。出发前请自行核实。',
  'help.guide.tour-walk-day-times.tip.1':
    '没有开始时间时，这一行会提示：“给这条漫步设置当天的时间，即可查看到达时间和营业时间。”',
  'help.guide.tour-walk-google-import.step.2': '把链接粘贴到“步行路线的链接”下，然后点击“读取链接”。',
  'help.guide.tour-walk-check-off.goal': '在当天把站点标为已去过或已跳过，并查看还剩多少路要走。',
  'help.guide.tour-walk-check-off.result': '已去过的站点被勾选，已跳过的带删除线，剩余时间只计算还没走的部分。',
  'help.guide.tour-bike-profile.goal': '开始一次骑行，让 TREK 按旅行、公路、砂石路或山地来规划路径。',
  'help.guide.tour-bike-profile.tip.1': '之后更改配置，会按新的配置重新规划整条路线。',
  'help.guide.tour-bike-surfaces.step.2': '卡片标题中的徽章显示路线中已知为未铺装路面的占比。',
  'help.guide.tour-bike-mtb-grades.title': '查看山地骑行路线的步道难度',
  'help.guide.tour-bike-mtb-grades.tip.3': '如果无法读取难度，卡片会提示。点击“重试”。',
  'help.ctx.trip-tour-ski.bullet.5':
    '打开“滑雪与冬季”路线时，地图会显示来自 OpenSnowMap 的雪道，开关旁边是“雪道图例”。这些全是地图数据：这里没有任何内容能说明某条雪道或缆车是否开放、雪况如何，也没有任何与雪崩有关的信息。',
  'help.guide.tour-ski-plan.step.6': '在“游览名称”下给路线起个名字，然后点击“保存”。',
  'help.guide.tour-ski-options.step.1':
    '在“滑雪与冬季”路线中，路径规划器的选项位于“项目”下方。你只会看到所选项目用得到的选项，例如“越野滑雪”就没有“最难的雪道”。',
  'help.guide.tour-ski-options.result': '路线会在你的限制内重新规划，“雪道路线”卡片会列出它避开的较难雪道。',
  'help.guide.tour-ski-fix-leg.tip.3': '离线时，各路段暂时画成直线。关于夏季小路的灰色行是提示，不是错误。',
  'help.guide.tour-ski-summary.tip.1': '“已避开”列出路径规划器因你设置的“最难的雪道”限制而避开的较难雪道。',
  'help.guide.tour-ski-pistes-layer.step.2': '点击“雪道图例”，即开关旁边带四个彩色圆点的按钮。',
  'help.guide.tour-ski-import.step.1':
    '在“游览”标签页中，点击“添加行程”（“本次旅行的游览活动”上方的加号），选择“导入 GPX 或 KML”并选取文件。',
  'help.guide.tour-ski-import.tip.3': '你也可以把 GPX、KML 或 KMZ 文件拖到“游览”标签页的任意位置，打开同样的预览。',
  'help.ctx.trip-tour-paddle.bullet.5':
    '“风速”显示路线所安排的那一天在路线起点的预报。“检查清单”列出已保存路线上的障碍，以及你对每个障碍的决定。',
  'help.guide.tour-paddle-setup.step.5': '在湖泊上，“穿越湖泊”决定走法：“直线穿越”最短，“沿岸”则在刮风的日子靠近岸边。',
  'help.guide.tour-paddle-water-route.title': '规划水上路段',
  'help.guide.tour-paddle-water-route.tip.2':
    '路线在绕过堰坝或穿过船闸的地方，TREK 会自己设一个点，标为“已识别”。如果你移动或修改它，它就变成你自己的点。',
  'help.guide.tour-paddle-portage.step.3': '点下方会出现“陆上搬运”卡片，显示其长度和额外增加的分钟数。点击它即可打开。',
  'help.guide.tour-paddle-lock.goal': '在路线上加入船闸，并把等待和通过的时间计入用时。',
  'help.guide.tour-paddle-lock.result': '船闸及其分钟数已加入路线，“用时估算”会把它们算进去。',
  'help.guide.tour-paddle-time.tip.1':
    'TREK 的起始值是水上 4 km/h、搬运 2 km/h，每处陆上搬运 10 分钟。这些只是可以调整的起始值，不是实测值。',
  'help.guide.tour-paddle-wind.step.3':
    '柱状图显示一天中的各个小时，阵风叠在平均风速后面。把鼠标移到某根柱子上，可以看到该小时的数值和风向。',
  'help.guide.tour-paddle-checklist.goal': '了解已保存路线上的堰坝、船闸和通行规则的已知情况，并决定在每一处怎么做。',
  'help.guide.tour-paddle-checklist.tip.3':
    '标为“再查一次”的条目，是在路线或数据发生变化之前做出的决定。请重新决定，或选择“保留决定”或“移除决定”。不再适用的决定会列在“先前的决定”下。',
  'help.guide.tour-paddle-track-marks.step.3': '点击“导入 1 条路线”。',
  'help.guide.tour-paddle-track-marks.result': '录制的轨迹带有它的陆上搬运和船闸，“用时估算”会把它们计算在内。',
  'help.guide.tour-horse-plan.title': '沿马道规划骑马游',
  'help.guide.tour-horse-plan.step.7': '在“游览名称”下给这次骑行起个名字，然后点击左栏底部的“保存”。',
  'help.guide.tour-horse-gap.goal': '接着继续一个起点离你骑行终点较远的路段。',
  'help.guide.tour-horse-gap.tip.3':
    '起点距你骑行终点 25 米以内的路段会直接接在其后，“与骑马游的衔接”显示为“接在骑马游终点之后”。',
  'help.guide.tour-horse-recorded.tip.1':
    '线条与文件录制时完全一致。不会重新规划任何路径，已记录的骑马游也没有可编辑版本。',
  'help.guide.dateless-trip.result': '卡片显示“想法”和“未设置日期”，旅行里有你要求数量的空白日期。',
  'help.guide.trip-reminder.title': '旅行前收到提醒',
  'help.guide.upcoming-reservations.tip.1': '酒店住宿会出现两次，一次是入住，一次是退房。',
  'help.guide.half-company-holiday.result': '公司这天休半天，在这一天登记的休假只消耗半天。',
  'help.guide.edit-holiday-calendar.title': '更改或移除假日日历',
  'help.guide.answer-fusion-request.result': '点击“接受并合并”后，两份计划会显示在同一个网格里，每个人用自己的颜色。',
  'help.guide.log-for-partner.result': '这些日子显示为对方的颜色，并计入对方的年假额度，而不是你的。',
  'help.guide.dissolve-fusion.tip.1': '在该窗口中点击“取消”，计划保持不变；无论哪种情况，你的条目都会保留。',
  'help.guide.country-places.tip.1':
    '地点被归到错误的国家下，通常是因为地址或坐标有误。从这里打开它所在的旅行，在那里修正该地点。',
  'help.guide.tour-activity-stats.title': '查看你在游览中的活动',
  'help.guide.tour-activity-stats.result':
    '对话框和“游览”标签页中的汇总不再包含你排除的那条路线。它的路线、日期和旅行都保持不变。',
  'help.guide.move-to-list.tip.2':
    '移动会把地点从列表中取走，所以只有列表所有者或管理员能看到“移动到列表”。“复制到列表”在你能打开的任何列表中都可用。',
  'help.guide.accept-list-invite.step.2': '点击“接受”加入，或点击“拒绝”回绝邀请。',
  'help.guide.tour-collection-add-to-trip.tip.2':
    '如果保存的路线没有线路，就必须同时带上它的路点。对话框会告诉你这一点，并替你选好这个选项。',
  'help.guide.tour-collection-manage.tip.1': '从列表中移除路线，不会影响你已经据此在旅行中创建的路线。',
  'help.guide.entry-draft.tip.2': '从 Dawarich 导入的一天，其条目会是草稿。分享之前请留意是否有这个徽章。',
  'help.guide.journey-map-layers.result': '地图只显示你想看的图层，每个图钉、圆点和线条的含义都可以在图例中查到。',
  'help.guide.journey-keep-route.result':
    '每日标题显示距离，路线以实线画在地图的“记录”图层上，旅程中的所有人都能看到。分享链接只有在开启“记录的路线”时才会显示它。',
  'help.guide.journey-day-stays.result':
    '你已做出决定的停留记录会从列表中消失。你写的条目和其他条目一样出现在对应的日期上，可以照常添加照片和文字。',
  'help.guide.journey-take-over-day.tip.2': '草稿不会出现在分享链接中。添加照片和文字后，在每个条目中关闭“草稿”。',
  'help.guide.journey-auto-prepare.tip.2': '某一天列表按钮上的圆点表示这一天还没有最终确定，悬停提示会说明原因。',
  'help.ctx.settings-plugins.bullet.3':
    '底部的“插件活动”按最新在前的顺序，列出插件以你的名义执行的每个操作，并带有“刷新”。',
  'help.guide.language-region.tip.3': '“每周开始于”决定所有日期选择器的第一列；“假期”有自己的设置。',
  'help.guide.web-push-device.tip.2': '在 iPhone 和 iPad 上，请先把 TREK 添加到主屏幕，再从主屏幕打开。',
  'help.guide.connect-airtrail.step.3': '点击“保存”，再点击“测试连接”。它会告诉你找到了多少个航班，徽章变为“已连接”。',
  'help.guide.connect-dawarich.step.3':
    '点击“保存”，再点击“测试连接”：它会统计最近 30 天的停留记录。连接后，“立即检查”会马上检查，右侧的“断开连接”用来结束连接。',
  'help.guide.tour-connect-wanderer.step.3':
    '点击“保存”，再点击“测试连接”。它会告诉你有多少条路线可以导入，徽章变为“已连接”。',
  'help.guide.tour-wanderer-watch.step.2':
    'TREK 每天最多读取一次你导入的每条路线的简短记录，该行会显示上次检查的时间。某条路线可能有变化时，你会收到通知，“提示”里也会计入：点击“提示”，可以看到每条路线显示为“可能已变化”“已变化”或“无法检查”，并从那里打开它。',
  'help.guide.plugin-settings.goal': '给插件配置你自己的密钥和偏好，并查看它以你的名义做了什么。',
  'help.guide.own-routing-engine.result': '每个旅行中的路线都由你自己的服务器计算。',
  'help.guide.admin-passkeys.title': '提供通行密钥登录',
  'help.guide.rotate-jwt-secret.tip.1': '你自己也会被退出登录，所以之后请马上重新登录。',
  'help.guide.notification-defaults.title': '为用户设置通知默认值',
  'help.ctx.notifications.title': '通知',
  'help.guide.read-notifications.goal': '查看你不在的时候旅行中发生了什么，并直接跳转过去。',
  'help.guide.filter-notifications.goal': '浏览全部通知，或只看还没读过的。',
  'help.guide.mark-notifications-read.step.1': '点击“标为已读”，即通知时间旁的双勾，只标记这一条。',
  'help.guide.delete-notifications.step.2': '顶部的“全部删除”会在对话框要求你确认之后，一次清空整个列表。',
  'help.guide.notification-settings.step.3':
    '点击“设置”侧边栏中的“通知”。它的第一张卡片中每个事件占一行，“应用内通知”一列决定铃铛里显示什么。',
  'help.guide.link-journal.result':
    '旅行的标签栏中会出现“旅程日志”标签页，你授予“阅读”或“编辑”权限的每个人都能在那里打开日志，并看到实时更新。',
  'help.guide.create-place.tip.4':
    '从 Google 地图复制的链接在搜索里同样有效：粘贴后按回车键，TREK 会从中读取地点。表单有了位置之后，搜索旁边的准星图标，即“此标记附近的地点”，会列出周围的地点。',
  'help.guide.dawarich-stays.step.2':
    '停留记录按日期分组，每条显示你何时到达和离开；仪表图标表示 Dawarich 不太确定的停留。点击“添加为地点”，即停留记录旁的图钉图标。',
  'help.guide.leave-stop-off-route.step.3': '要让它重新参与路线，打开同一个菜单，选择“重新加入路线”。',
  'help.guide.move-booking-day.tip.1': '跨多日预订中间那些日子上的淡色行不能拖动，有中转的航班的单独一段也不能拖动。',
  'help.guide.place-image-from-file.step.2':
    '点击标题中的圆形图片。因为该地点有照片，会弹出一个小窗口，问你图片从哪里来。',
  'help.guide.place-own-hours.goal': '查到的时间有误或缺失时，把你实际核实过的营业时间放到卡片上。',
  'help.guide.place-own-hours.tip.2':
    '电话和电子邮件会以标签的形式显示在卡片标题中。点击其中一个，会交给你的手机或邮件应用打开。',
  'help.guide.edit-accommodation.tip.3':
    '如果在“设置”的“显示”下开启了“隐藏预订编号”，确认号会保持模糊。把鼠标移上去或点击它，即可查看。',
  'help.guide.confirm-stay-booking.tip.1': '再点一次这个标签，预订就会回到“待确认”。',
  'help.guide.map-markers.tip.4':
    '在“设置”>“显示”的“旅行与地图”下开启“未规划地点使用紧凑标记”后，尚未安排到任何一天的地点会变成不带照片和评分的小圆点。你选中的地点始终完整显示。',
  'help.guide.tour-map-lines.step.1':
    '旅行中的每条游览路线，都会以自己颜色的线画在地图上，起点处有它的图钉。如果你给路线选了颜色，线条就用这个颜色，否则用它所属分类的颜色。',
  'help.guide.car-stops.step.6': '点击“添加”。',
  'help.guide.transport-details.step.4':
    '点击标题，可以直接重命名这段交通，不用打开表单。“重命名”打开时已经填好了当前名称：输入新名称并点击“保存”。',
  'help.guide.export-transports-csv.goal': '把旅行中的交通从 TREK 导出为 CSV 文件，用于电子表格、旅行社或打印。',
  'help.guide.group-sort-bookings.result': '预订按你选的分区和顺序排列，这个浏览器会记住你的选择，下次访问时沿用。',
  'help.guide.booking-on-map.step.1':
    '点击一张有地点的预订卡片，地点在“地点 / 活动”下关联，住宿则在“住宿”下关联。它的详情随即打开。',
  'help.guide.export-bookings-csv.title': '把预订导出为电子表格',
  'help.guide.export-bookings-csv.tip.3':
    '标签页里一有预订，这个按钮就会出现。“交通”标签页以同样的方式导出它自己的条目。',
  'help.guide.arrange-packing-list.title': '按你的顺序排列行李清单',
  'help.guide.count-packed-pieces.result': '该行显示已打包多少件，放入最后一件后，物品会自动勾选。',
  'help.guide.expense-receipts.title': '给支出附上收据',
  'help.guide.expense-receipts.tip.1':
    '在编辑器里，点击已列出文件的名称，会打开同样的预览。此时按 Esc 键只会关闭预览，不会关闭这笔支出。',
  'help.guide.files-sync-settings.step.5':
    '“当两边都有改动时”决定同一份文档在两边都被编辑过时保留哪个副本：“询问我”“保留 TREK 的副本”或“保留存储端的副本”。“自动同步”让 TREK 在后台检查变化；关闭时，卡片显示“已暂停”，只有点“立即同步”才会同步。这里的每项改动都会立即保存。',
  'help.guide.manage-notes.step.5':
    '“删除”会先询问“删除备注？”，因为这条笔记会对所有成员删除，它的文件也会一并删除。点击“删除”确认。',
  'help.guide.note-categories.step.3': '点击分类的名称即可重命名。输入新名称并按回车键；按 Esc 键则保留旧名称。',
  'help.guide.roadtrip-reorder.step.2':
    '要把站点移到另一天，把它放到那一天卡片中的某个站点上。拖动时，站点少于两个的日子会在导轨末尾显示为一张虚线卡片，你也可以放到那张卡片上。',
  'help.guide.roadtrip-corridor.tip.4':
    '在筛选下方，选择当天的一个站点，或选“两点中间”，只保留距离该点 25、50 或 100 公里以内的结果。列表中有充电桩时，“任意接口”和“任意功率”可以按插座和功率缩小范围。',
  'help.guide.roadtrip-overnight.result': '该地点作为当天的过夜点出现在行程中，住宿像其他住宿一样订在旅行里。',
  'help.guide.roadtrip-stop-fill.result':
    '在这个站点，油箱或电池会加到你选的数值。之后的续航，包括“此处将耗尽油量”区段，都以此为基础计算。',
  'help.guide.roadtrip-bookings.step.4': '点击卡片即可打开预订。',
  'help.guide.roadtrip-google-import.goal': '把你在 Google 地图里规划的路线变成你某一天的站点。',
  'help.guide.roadtrip-google-import.tip.3': '导入需要联网，还需要同时有编辑地点和日期的权限。',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD 覆盖德国，GDACS 报告全球的灾害。只以一个点给出的警告，会注明其影响区域未知。',
  'help.ctx.trip-tours.bullet.5':
    '在日期栏中，路线和站点一样是一行。有“开始”时间时显示为开始 → 结束，结束时间由路线的用时推算；“更多选项”里有“编辑”“从当天移除”“从路线中排除”和“保存到收藏”。',
  'help.guide.tour-show-list.step.5': '点击同一个开关中的“地点”，即可回到地点列表。',
  'help.guide.tour-add-to-day.step.2': '选择日期。菜单列出旅行的每一天及其日期和标题，已有这条路线的那一天会变灰。',
  'help.guide.tour-add-to-day.result': '路线列在它所在的日期下，它的线路成为地图上那一天的一部分。',
  'help.guide.tour-day-times.tip.2':
    '只包含多日路线中某一个阶段的那一天，不会有推算出的结束时间，因为路线的用时是整条路线的用时。',
  'help.guide.tour-remove-from-day.step.3':
    '或者点击当天的标题打开这一天，点击列表中的路线，再点击其卡片底部的“从当天移除”。',
  'help.guide.tour-filter-list.step.3':
    '列表里混有多种情况时，“来源”（TREK、GPX 导入、wanderer）、“路线上限”（T1 到 T6）和“类型”（“徒步”“骑行”等）可以进一步缩小范围。再点一次已勾选的值即可清除。',
  'help.guide.tour-hide-on-map.step.1': '指向列表中的路线，点击其行右侧出现的眼睛图标（“在地图上隐藏”）。',
  'help.guide.tour-import-plan-tab.step.1': '在“计划”标签页中，点击右栏顶部开关里的“游览”。',
  'help.ctx.trip-tour-detail.bullet.1':
    '点击“游览”列表中的路线（先把右栏从“地点”切换到“游览”）、它在某一天里的那一行，或它在地图上的线条，卡片就会在地图上方打开。卡片打开期间，地图仍然可以操作。',
  'help.guide.tour-detail-read.step.2':
    '标题写明路线的名称，并用标签做了汇总：这是哪种路线、导入时的来源、计划用时、距离、爬升和下降。',
  'help.guide.tour-detail-read.tip.3':
    '有些路线会显示更多内容：城市漫步显示站点，划桨游显示检查项和风，已经完成的路线显示“实际轨迹”，关联了清单的路线显示“行李清单”。',
  'help.guide.tour-rename-colour.step.3':
    '点击路线圆形图块一角的彩色圆点，即“轨迹颜色”。“轨迹颜色”部分会在标题下方展开。',
  'help.guide.tour-take-along.step.2':
    '如果路线有网页，旁边的按钮会显示网站名称（Komoot、AllTrails、Outdooractive 或 Wanderer），其他网站则显示“网站”。点击会在新标签页中打开该页面。',
  'help.guide.tour-copy-keep.goal': '在这个旅行中做一个路线的变体，或把它保存到你的某个收藏里，留给以后的旅行使用。',
  'help.guide.tour-copy-keep.tip.4':
    '只有收藏扩展开启时才有“收藏”。你只有阅读权限的列表无法选择；还没有任何列表时，对话框会提供“打开收藏”。',
  'help.guide.tour-packing-link.step.5': '点击“打开行李清单”来勾选物品。TREK 会切换到“列表”标签页中的行李清单。',
  'help.guide.tour-files.step.2': '它下面的一行现在会统计这些文件，列表随之展开。',
  'help.guide.tour-activity-link.step.2': '在“完成于”下，勾选你走这条路线的那一天。如果不属于任何一天，选“无日期”。',
  'help.guide.tour-activity-compare.title': '对比计划和你实际走的情况',
  'help.guide.tour-activity-compare.result': '你可以在卡片和地图上，一眼对比这一天和计划有什么不同。',
  'help.guide.tour-origin-check.tip.3': '“未连接 wanderer”表示你的账户还没有连接。请在“设置”的“集成”下连接。',
  'help.ctx.trip-tour-planner.bullet.5':
    '地图顶部的“搜索地点或地址”用来移动地图。左下角的标签可以在该路线类型提供的地图之间切换，例如“地形图”或“卫星影像”，也包含打开的路线的开关，例如“放置点”和 3D。',
  'help.guide.tour-open-workspace.step.5':
    '地图顶部的“搜索地点或地址”会把地图移到某个地点，这样你就可以从路线所在的地方开始。',
  'help.guide.tour-draw-route.goal': '在地图上设置新路线的各个点，让 TREK 计算它们之间的路径。',
  'help.guide.tour-draw-route.tip.2':
    '地图标签中的“地形图”或“徒步”会显示小路，这样更容易点到其中一条。如果某个点离该类型可用的道路太远，会出现提示，而不是路线。',
  'help.guide.tour-type-profile.step.3':
    '骑行会在类型下面询问“配置”：“旅行”“公路”“砂石路”或“山地”。下方的一行说明该配置偏好什么。',
  'help.guide.tour-edit-points.step.2': '点击“路点”下的一行，选中它对应的点。它的图钉会在地图上高亮显示。',
  'help.guide.tour-shaping-points.title': '用塑形点调整路线',
  'help.guide.tour-shaping-points.tip.3': '在骑马游中，点击线条不会添加任何点，因为没有路径规划器来调整它。',
  'help.guide.tour-loop-reverse.tip.2':
    '删掉“返回起点”这一行，就能把它重新变回单程路线。路线反向时，手动绘制的路段仍然保持手动绘制。',
  'help.guide.tour-leg-by-hand.step.4': '“重新计算下一段”会再次让路径规划器只规划这一段，不影响其他路段。',
  'help.guide.tour-trip-places.step.3': '点击一个地点。它会作为路线的新终点加入，列表保持打开，方便添加下一个。',
  'help.guide.tour-details-times.step.1':
    '左侧导轨顶部的“游览名称”用来填写名称。新路线上，那里的灰色文字，例如“未命名的徒步活动”，只是占位提示，请输入你自己的名称。',
  'help.guide.tour-save.title': '保存路线',
  'help.guide.tour-save.tip.3':
    '如果某个字段的值无效，例如网站不是一个有效地址，也无法“保存”。“详情”会自动展开，把它显示出来。',
  'help.guide.tour-edit-saved.tip.1': '对没有改动的路线，“保存”保持灰色。',
  'help.guide.tour-summary-profile.step.3':
    '沿着“海拔剖面图”移动鼠标指针。它会显示那一点的距离和高度，地图上也会有一个圆点标出同一位置。',
  'help.guide.tour-list-manage.step.1':
    '“行程汇总”位于列表上方。折叠时，它显示路线数量，以及“计划中”和“未规划”的数量。右侧的箭头会展开成每种类型一行，汇总其距离、爬升、下降和用时。',
  'help.guide.tour-list-manage.result': '你能看到筛选后所显示路线的合计，每条路线也都安排在你想要的那一天。',
  'help.guide.tour-delete.result': '路线已从列表、地图和每一天中消失。',
  'help.guide.tour-saved-elsewhere.tip.2':
    '如果你在另一台设备上修改了路线，也会这样。没有改动的路线只会重新加载，并有提示说明。',
  'help.ctx.trip-tour-import.bullet.5':
    '在“设置”的“集成”中连接 wanderer 后，没有打开路线时，“规划新游览路线”旁边会出现一个 wanderer 按钮。它列出你自己的路线，供你导入。',
  'help.guide.tour-import-gpx.tip.1': '你也可以把文件从电脑拖到“游览”标签页上松手，同样会打开这个预览。',
  'help.guide.tour-view-import.step.1': '在“游览”标签页中，点击“本次旅行的游览活动”里带“GPX 导入”徽章的路线。',
  'help.guide.tour-plan-from-import.goal': '从录制的轨迹得到可以移动的路点，并查看新路线与原轨迹有多接近。',
  'help.guide.tour-plan-from-import.tip.4': '“骑马游”没有可编辑版本：它按骑行时的原样保存。',
  'help.guide.tour-restore-recorded.tip.2':
    '用“规划为新游览路线”创建的路线没有自己的录制轨迹。它所来自的导入仍在列表中。',
  'help.guide.tour-take-over.step.5': '如果需要，可以在“在本行程中的名称”下给它另起一个名字。',
  'help.guide.tour-import-wanderer.step.1': '在“游览”标签页中，没有打开路线时，点击“规划新游览路线”旁边的 wanderer。',
  'help.guide.tour-import-wanderer.result': '这条路线成为旅行的一条路线，并在地图上作为“wanderer 游览路线”打开。',
  'help.guide.tour-map-layers.title': '为路线选择地图',
  'help.guide.tour-map-layers.tip.3':
    '划桨游和城市漫步只提供“地图”和“卫星影像”；跑步、滑雪和骑马游提供“地图”“地形图”和“卫星影像”。',
  'help.guide.tour-along-search.result': '路线沿途的地点已列在列表中，也标在地图上，可以逐个查看了。',
  'help.guide.tour-along-add-stop.step.3': '点击“添加为停靠点”。旁边的徽章是对绕路距离的粗略估计，按直线距离测量。',
  'help.guide.tour-3d-terrain.step.1':
    '在“游览”标签页中打开一条路线，点击左下角标签末尾的 3D。地图会倾斜，以 3D 显示地形，路线画在地形上。',
  'help.guide.tour-3d-terrain.tip.3':
    '地形需要联网：高度数据来自开放的 Mapzen 地形瓦片。划桨游用自己的颜色绘制，不显示坡度，因为水面是平的。',
  'help.guide.tour-3d-flyover.tip.1': '飞越期间滚动鼠标滚轮可以放大或缩小，相机始终跟着圆点。暂停之前，不能拖动地图。',
  'help.guide.tour-map-overlays.step.4': '在划桨游上，标签里提供的是“航标”。点击它，水面上会显示浮标、信标和港口标志。',
  'help.ctx.trip-tour-stages.bullet.2':
    '站点“更多操作”菜单中的“在此结束阶段”会在该站点结束一个阶段。“路点”随后会为每个阶段显示“阶段 N”标题，以及它的距离和用时，结束阶段的站点带有月亮图标。',
  'help.guide.tour-multi-day.step.3': '指向第一天结束的那个站点，点击“更多操作”，选择“在此结束阶段”。',
  'help.guide.tour-multi-day.result': '一条路线被分成几个阶段，每个阶段单独计算。点击“保存”即可保留。',
  'help.guide.tour-stages-on-days.step.6':
    '旁边的箭头，即“在规划器中打开此阶段”，会在编辑器中打开这条路线，并定位到那个阶段。',
  'help.ctx.trip-tour-hike.bullet.1':
    '编辑器顶部的“路线类型”决定路线怎样规划。“徒步”使用难度不超过“详情”下“步道最高难度”的小路；“跑步”选用适合跑步的道路，并要求你填写“计划配速”。',
  'help.guide.tour-hike-plan.step.1': '点击左栏顶部的“规划新游览路线”。编辑器会以“新游览路线”打开。',
  'help.guide.tour-hike-plan.tip.2':
    '选择 T4 及以上时，会先问“启用高山路线规划？”。只有路线可以穿越暴露或没有标记的地形时才确认；每个编辑会话只会问一次。',
  'help.guide.tour-hike-trail-details.step.4': '点击列表中的某个等级，地图上就只画出这些路段。再点一次则显示整条路线。',
  'help.guide.tour-hike-round.step.1':
    '打开徒步路线后，点击“路点”卡片标题中的“从起点规划环线”。如果要从其他站点出发，打开它的“更多操作”，选择“从这里规划环线”。',
  'help.guide.tour-hike-round.tip.3': '“重新搜索”会回到距离设置，“取消”则关闭卡片，不做任何改动。',
  'help.guide.tour-hike-compare-ways.tip.1':
    '只有徒步才有这个功能，而且只适用于路径规划器规划的路段，手动绘制的路段不行。',
  'help.guide.tour-ferrata-add.step.4': '在“路点”中，这两个点之间的路段会显示该飞拉达的名称、难度和长度。',
  'help.guide.tour-run-plan.goal': '在适合跑步的道路上规划跑步，并根据你的配速得出用时。',
  'help.guide.tour-run-plan.tip.2': '爬升、下降和道路的技术难度都不计入用时：用时就是距离乘以配速，别无其他。',
  'help.guide.tour-run-ways.result': '出发之前，你就知道这次跑步有哪些路段不在柏油路上。',
  'help.ctx.trip-tour-walk.bullet.4':
    '“沿途”按“漫步主题”在路线一定距离内查找景点，“添加为停靠点”会把其中一个规划进漫步中你选定的位置。',
  'help.guide.tour-walk-plan.step.5':
    '把“重要程度”设为“普通”“可选”或“必去”。如果某个站点在之后提出调整建议时必须保持原位，就打开“受保护”，然后点击“保存”。',
  'help.guide.tour-walk-sights.step.1':
    '打开城市漫步后，在左栏找到“沿途”，选择一个“漫步主题”：“文化与历史”“公园与景观”“美食与本地生活”或“综合”。',
  'help.guide.tour-walk-sights.result': '这个景点成为漫步的一个站点，规划在你所选站点之间的路线上。',
  'help.guide.tour-walk-day-times.tip.2': '如果某个站点还没有设置停留时间，它之后的到达时间会显示为最早可能的时间。',
  'help.guide.tour-walk-google-import.step.3': '查看“链接中的站点”。链接里没有给出位置的站点会被标出并省略。',
  'help.guide.tour-walk-check-off.step.1': '在“计划”标签页中，点击当天计划里的城市漫步。它的卡片会在地图旁边打开。',
  'help.ctx.trip-tour-bike.title': '骑行路线',
  'help.guide.tour-bike-profile.step.1': '在“游览”标签页中，点击左侧导轨顶部的“规划新游览路线”。',
  'help.guide.tour-bike-profile.tip.2':
    '配置只是给路径规划器一个倾向，不能说明某条路能不能骑：“路面与道路”卡片会显示路线实际经过的路面。',
  'help.guide.tour-bike-surfaces.step.3':
    '在“路面”下，点击一行，例如“砾石”或“自然地面”。对应的路段会在地图上亮起。再点一次该行即可取消。',
  'help.guide.tour-bike-mtb-grades.goal': '骑行之前，先了解山地骑行路线上的步道有多难。',
  'help.guide.tour-bike-mtb-grades.tip.4': '把“配置”从“山地”切换成别的，难度分段就会消失，路线随后按新配置重新规划。',
  'help.guide.tour-ski-plan.title': '规划滑雪与冬季路线',
  'help.guide.tour-ski-plan.tip.1':
    '选择“越野滑雪”时，还要选“技术”：“传统式”“自由式”或“未知”。字段下方的提示会说明还缺什么。',
  'help.guide.tour-ski-options.step.2': '打开“最难的雪道”，选择你想滑的最高等级，从“入门”到“专家”。默认是“中级”。',
  'help.guide.tour-ski-fix-leg.title': '修复无法规划的滑雪路段',
  'help.guide.tour-ski-fix-leg.tip.4': '在每个路段都规划完成之前，“雪道路线”卡片会提示还没有滑雪用时。',
  'help.guide.tour-ski-summary.tip.2':
    '在每个路段都规划完成之前，“滑雪用时”一直显示“未计算”。如果仍想给路线一个用时，请在它的详情中输入计划的总用时。',
  'help.guide.tour-ski-pistes-layer.step.3':
    '图例按难度显示下坡雪道、越野滑雪道、冬季徒步和雪鞋路线、雪橇道和缆车。点击“OpenSnowMap 上的完整图例”可打开完整图例。',
  'help.guide.tour-ski-import.step.2': '在“导入预览”中，打开“导入为”，选择“滑雪与冬季”。',
  'help.guide.tour-ski-import.result': '这条轨迹出现在“本次旅行的游览活动”中，它的项目和技术显示在“滑雪轨迹”卡片上。',
  'help.ctx.trip-tour-paddle.bullet.6':
    '左栏底部的“划桨有风险”一行会打开“水上安全”。地图提供“地图”和“卫星影像”，并可叠加“航标”。',
  'help.guide.tour-paddle-setup.step.6':
    '“划桨速度”以灰色显示船型的建议值。输入你自己的速度后，字段会显示“自定速度”；其下的链接“使用建议值”会重新采用船型的速度。',
  'help.guide.tour-paddle-water-route.goal': '让 TREK 沿河流或湖泊规划路段，并看懂无法规划的路段给出的提示。',
  'help.guide.tour-paddle-water-route.tip.3':
    '已规划路段下的备注会标出急流及其等级、“皮划艇通道”，或用直线衔接的“地图数据缺口”。',
  'help.guide.tour-paddle-portage.step.4':
    '在“路线”下，“沿道路”沿着地图上标注的道路搬运，“直线”则直接穿过去。TREK 会自己寻找路径，如果没有不需要长距离绕行的路径，会告诉你。',
  'help.guide.tour-paddle-lock.step.1': '指向船闸所在的站点，点击“更多操作”，也就是三个点。',
  'help.guide.tour-paddle-time.title': '查看并调整划桨游的用时',
  'help.guide.tour-paddle-time.tip.2': '水流和风不计入估算。',
  'help.guide.tour-paddle-wind.step.4': '打开“风对划桨的影响”，了解顶风、侧风、开阔水面穿越和阵风会对船产生什么作用。',
  'help.guide.tour-paddle-checklist.step.1':
    '保存划桨游，然后在左栏找到“检查清单”。它标题中的徽章汇总了清单的完成进度。',
  'help.guide.tour-paddle-checklist.tip.4':
    '障碍信息来自 TREK 所持有区域的 OpenStreetMap 数据。没有数据的地方，卡片会说明，你需要自己核查堰坝、船闸和陆上搬运。',
  'help.guide.tour-paddle-track-marks.step.4':
    '点击“本次旅行的游览活动”中的这条轨迹。左栏会按录制时的样子显示它，并带有“陆上搬运与船闸”卡片。',
  'help.ctx.trip-tour-horse.title': '骑马游',
  'help.guide.tour-horse-plan.goal': '用地图视图中带路标的马道路段拼出一次骑马游。',
  'help.guide.tour-horse-plan.result':
    '骑行沿着你采用的各个路段，每个路段都带有所属路线的名称、通行圆点和长度，并列在“本次旅行的游览活动”下。',
  'help.guide.tour-horse-gap.step.1':
    '骑行中已有一个路段时，打开另一条路线，选一个与你骑行终点不相接的路段。在“与骑马游的衔接”下，会有提示说明两者相距多远。',
  'help.guide.tour-horse-recorded.title': '保留 GPX 文件中的已记录骑行',
  'help.guide.tour-horse-recorded.tip.2': '没有海拔的文件会显示“文件中没有海拔”，而不是爬升为零。',
  'help.guide.dateless-trip.tip.1':
    '确定出行时间后，点击卡片上的铅笔图标打开表单，选好日期。已规划的各天顺序不变，会按顺序依次填上日期。',
  'help.guide.trip-reminder.goal': '出发前几天收到提醒。',
  'help.guide.upcoming-reservations.tip.2': '“待确认”表示预订尚未确认。已取消的预订和已归档的旅行不会列出。',
  'help.guide.half-company-holiday.tip.1': '当天已登记的休假会减为半天，之后再登记这一天的人也只占用 0.5 天。',
  'help.guide.edit-holiday-calendar.goal': '重命名、改颜色、移动或删除你添加的公共假日或学校假期日历。',
  'help.guide.person-color.title': '更改成员的颜色',
  'help.guide.answer-fusion-request.tip.1': '请求会一直保留，直到你回应。如果有多个请求，会依次显示。',
  'help.guide.log-for-partner.tip.1': '“半天”和“调休”对所选成员同样适用。',
  'help.guide.dissolve-fusion.tip.2': '如果只想让对方看到你的日期，请改为共享你的日历。',
  'help.guide.country-details.tip.2': '点击“地点”徽章，可查看该国家下计入的所有地点，按旅行分组。',
  'help.guide.country-places.tip.2': '只有该国家有自己的地点时才会出现这个徽章。仅手动标记的国家没有。',
  'help.guide.tour-activity-stats.goal':
    '按时间段和类型查看你所有旅行中已完成路线的距离、爬升和数量，没有成行的路线不计入。',
  'help.guide.tour-activity-stats.tip.1':
    '路线要等其最后一天过去后才会计入。没有安排到任何一天，或只安排在没有日期的日子上的路线永远不会计入。想让它计入，请在所属旅行中把它放到有日期的一天。',
  'help.guide.move-to-list.result': '这些地点已出现在另一个列表中，并有一条简短提示说明移动或复制了多少个。',
  'help.guide.accept-list-invite.tip.1': '你在列表中能做什么，取决于所有者给你的角色：查看者、编辑者或管理员。',
  'help.guide.tour-collection-add-to-trip.title': '把列表中的路线添加到旅行',
  'help.guide.tour-collection-add-to-trip.tip.3':
    '想把路线保存到列表，请在旅行中打开已保存的路线，点击其底部的“收藏”。',
  'help.guide.tour-collection-manage.tip.2': '只有列表的所有者和管理员能看到垃圾桶。',
  'help.guide.entry-draft.result': '条目仍保留在你的时间线中，标为“草稿”，不会出现在分享链接里。',
  'help.guide.journey-map-layers.title': '选择旅程地图显示的内容',
  'help.guide.journey-keep-route.title': '保留你某一天录制的路线',
  'help.guide.journey-day-stays.title': '根据 Dawarich 记录的停留记录写条目',
  'help.guide.journey-take-over-day.title': '导入整个已记录的一天',
  'help.guide.journey-take-over-day.result':
    '这一天会为每条停留记录或每个合并后的组生成一份草稿，或生成一份当日记述，这些停留记录不再显示为待处理。',
  'help.guide.journey-auto-prepare.result': '关联的旅行进行期间，每天的停留记录会列在当天，随时可以“导入当天”。',
  'help.ctx.settings-about.title': '关于',
  'help.guide.web-push-device.tip.3': '推送需要通过 HTTPS 打开 TREK。如果通知被屏蔽，请在浏览器设置中允许后再试。',
  'help.guide.connect-airtrail.result': '徽章显示“已连接”，旅行的“交通”标签页会提供“从 AirTrail 导入”。',
  'help.guide.connect-dawarich.result': '徽章显示“已连接”，行程规划、旅程日志和足迹就能使用 Dawarich 记录的内容。',
  'help.guide.tour-connect-wanderer.result':
    '徽章显示“已连接”，旅行的“游览”标签页就能搜索你的 wanderer 并导入其中的路线。',
  'help.guide.tour-wanderer-watch.result':
    'TREK 会检查你导入的路线，在其中某条可能有变化时通知你。只有你接受变更，路线才会改变。',
  'help.guide.plugin-settings.step.1':
    '在设置侧边栏中打开“插件”。“插件设置”下，每个需要你填写内容的插件都有一张带字段的卡片：填好后点击“保存”。卡片上的操作在你确认后执行。',
  'help.guide.profile.step.3': '点击卡片底部右侧的“保存资料”。',
  'help.guide.default-user-settings.title': '设置新用户的初始状态',
  'help.guide.own-routing-engine.tip.1': '公共 OSRM 服务器大约每秒只允许一个请求。规划一天够用，但公路旅行可能会偏慢。',
  'help.guide.admin-passkeys.goal': '让用户用指纹、面部或设备 PIN 登录。',
  'help.guide.rotate-jwt-secret.tip.2':
    '如果只想让某一个人退出登录，请在“编辑用户”中给他设置“新密码”，这只会终止他的会话。',
  'help.guide.notification-defaults.goal': '决定所有用户的通知初始状态，并针对某个事件彻底屏蔽一个渠道。',
  'help.ctx.notifications.summary':
    'TREK 在应用内向你显示的所有通知，最新的在前：别人修改的预订、旅行聊天中的新消息、与你共享的日历。右上角的铃铛显示最新的十条，此页面显示全部。',
  'help.guide.read-notifications.step.1': '点击右上角的铃铛。铃铛上的红色数字是你尚未阅读的通知数量。',
  'help.guide.filter-notifications.step.1': '点击右上角的铃铛。',
  'help.guide.mark-notifications-read.step.2': '点击顶部的“全部标为已读”，一次把所有通知标为已读。',
  'help.guide.delete-notifications.tip.1': '删除只会为你自己移除通知，通知所涉及的预订、消息或分享不受影响。',
  'help.guide.notification-settings.tip.1': '单元格中的锁表示管理员已为所有人关闭该事件。',
  'help.guide.add-guest.tip.3':
    '只有旅行所有者能添加、重命名和移除访客。已为某笔支出付款的访客无法移除，请先更改付款方或删除该付款。',
  'help.guide.link-journal.tip.1': '只能关联你自己拥有的日志，你只有写入权限的日志无法关联。',
  'help.ctx.trip-places.bullet.7':
    '搜索框旁边的勾选图标用来开始选择。用栏底部的工具条，可以一次为多行设置新分类、加入收藏、标记为已去过或删除。',
  'help.guide.filter-places.step.5':
    '旅行涉及多个国家或地区后，地球图标可以把列表缩小到某个国家，或其中的某个地区，每一项都带有数量。“清除筛选”会回到“所有国家”。',
  'help.guide.import-places-file.tip.3':
    '“游览”功能开启时（默认开启），文件要通过栏顶部的“游览”和“导入 GPX 或 KML”导入，其中的线路会变成路线。文件中的图钉不会在那里导入，因为路线只包含线条。',
  'help.guide.dawarich-stays.step.3':
    '核对“名称”“到达”和“离开”，选择一天，或保持“尚未安排到某一天”，需要的话填写笔记，然后点击“添加地点”。',
  'help.guide.leave-stop-off-route.result':
    '该站点仍属于当天，也仍在 PDF 中。标为“不在路线内”期间，路线会从它前一个站点直接通向后一个站点。',
  'help.guide.move-booking-day.tip.2': '在它所在的那一天内，带时间的预订总会回到由其时间决定的位置。',
  'help.guide.place-image-from-file.step.3':
    '在“从附件中选择”下，点击你想要的照片。上方的“从设备上传”则是从你的电脑选择新照片。',
  'help.guide.place-own-hours.step.1': '打开该地点，点击卡片右下角的“编辑”，地点的表单随即打开。',
  'help.guide.place-own-hours.tip.3': '点击“移除营业时间”，再点击“更新”，卡片就会重新显示自动查到的营业时间。',
  'help.guide.confirm-stay-booking.title': '确认住宿的预订',
  'help.guide.confirm-stay-booking.tip.2': '同样的标签适用于所有预订，包括当天“预订”下的那些。',
  'help.guide.map-lock.tip.2':
    '此浏览器会记住所有旅行的锁定状态。打开旅行时，地图仍会缩放到该旅行一次，所以不会打开到一片空白区域。',
  'help.guide.tour-map-lines.step.2':
    '点击线条，或线条起点处的图钉。这条路线的卡片会在地图底部上方打开，线条会加粗并带上白边，方便你在其他线条中认出它。点击卡片标题中的 X 即可关闭。',
  'help.guide.car-stops.title': '规划带沿途停靠点的行车',
  'help.guide.car-stops.result':
    '这次行车是“交通”标签页上的一张卡片，也是当天的一行。它在地图上的线路从取车点出发，按顺序经过每个停靠点，直到还车。',
  'help.guide.transport-details.step.5':
    '详情底部的“在地图上”会显示这段交通的线路，并跳转到它所在日期的“计划”。最右侧的“编辑”打开完整表单，旁边的垃圾桶在你确认后删除这段交通。',
  'help.guide.export-transports-csv.step.1':
    '如果只想导出一部分，请先缩小列表范围。“搜索”“筛选”和“视图选项”下的排序都会生效：文件内容就是标签页显示的内容，顺序也与之相同。',
  'help.guide.group-sort-bookings.tip.1':
    '“卡片”和“列表”各自保留自己的分组：卡片默认按状态，列表默认按日期。“视图选项”上出现圆点，表示有设置与默认值不同，点击面板底部的“重置视图”即可恢复默认。',
  'help.guide.booking-on-map.step.2': '点击详情底部的“在地图上”。',
  'help.guide.export-bookings-csv.goal': '把旅行的预订导出为 CSV 文件，可用 Excel、Numbers 或任何其他电子表格打开。',
  'help.guide.arrange-packing-list.goal': '把整个清单和单个物品移到想要的位置，或按名称顺序查看每个清单。',
  'help.guide.check-off-packing.tip.4': '数量大于一的物品，也可以逐件标记已打包的件数，详见“一种物品打包多件”。',
  'help.guide.count-packed-pieces.tip.1': '勾选方框会一次打包所有件数，取消勾选则全部取消打包。',
  'help.guide.expense-receipts.goal': '把收据或发票与所属的支出放在一起，并能从账本中再次打开。',
  'help.guide.expense-receipts.tip.2':
    '收据旁的垃圾桶会在你保存时把它从支出中移除。文件本身仍留在“文件”中，要彻底删除请在那里删除。',
  'help.guide.files-sync.tip.4':
    '如果卡片上出现带“重新连接”的黄色提示，说明存储服务不再接受已保存的登录信息。点击“重新连接”，输入新的应用密码或令牌，同步就会恢复。',
  'help.guide.files-sync-settings.result':
    '从下一次运行起，旅行只按你选择的方向同步，删除和冲突的编辑则按你设置的规则处理。',
  'help.guide.manage-notes.result':
    '这条笔记会从“笔记”卡片中消失，所有成员同时生效。你只是置顶或修改过的笔记会保留，其他人看到的是你留下的样子。',
  'help.guide.note-categories.step.4':
    '一行中的颜色圆点用来设置该分类的颜色：靛蓝、红色、琥珀色、翡翠绿、蓝色或紫罗兰。这里让“住宿”变成琥珀色。',
  'help.guide.roadtrip-reorder.step.3':
    '用键盘操作时，先聚焦一个站点，然后按 Alt 加上或下方向键，即可在当天内把它移动一个位置。',
  'help.guide.roadtrip-overnight.title': '在路线途中过夜',
  'help.guide.roadtrip-overnight.tip.1':
    '这一晚持续到次日。其他日期需要修改预订：请在“天”下与住宿的其余部分一起更改日期。',
  'help.guide.roadtrip-stop-fill.tip.1':
    '只有你的车能在那里补给的站点才带有该徽章：“燃油”对应加油站点，“电动”对应充电站点，“两者”则两种都有。',
  'help.guide.roadtrip-bookings.result':
    '每条已预订的交通都会出现在行车中它发生的位置，它前后的路线则分别通向和离开它的枢纽。',
  'help.guide.roadtrip-google-import.step.1': '点击“路线途中”顶部的三个点，选择“导入 Google Maps 路线”。',
  'help.guide.roadtrip-hazards.title': '在地图上显示当前警告',
  'help.guide.roadtrip-hazards.tip.3': '数据源每十分钟刷新一次，需要联网。与其他驾驶设置一样，这个开关是按旅行保存的。',
  'help.ctx.trip-tours.bullet.6': '修改路线和删除路线要在“游览”标签页的“本次旅行的游览活动”下进行。',
  'help.guide.tour-show-list.tip.1': '点击地图上某条路线的线条，列表会标出这条路线并滚动到它。',
  'help.guide.tour-add-to-day.step.3':
    '出现“已添加到第 10 天”即表示成功，该行会多出一个日期徽章，左栏中那一天也会列出这条路线及其时间、距离和爬升。',
  'help.guide.tour-day-times.title': '给路线设置当天的开始时间',
  'help.guide.tour-day-times.tip.3':
    '同一菜单中的“从路线中排除”会让路线仍留在当天，但不计入地图上当天的路线。“重新加入路线”可撤销。',
  'help.guide.tour-remove-from-day.tip.1': '多日路线只能一天一天地移除，因为每一天都有自己的阶段。',
  'help.guide.tour-filter-list.step.4':
    '关闭菜单。按钮上现在显示状态、剩余的路线数量，以及每多设置一个筛选条件就加 +1。',
  'help.guide.tour-hide-on-map.step.2':
    '这条路线的线条在地图上被隐藏了。它所在的行仍留在列表中，显示为暗色，并带有一个划掉的眼睛图标（“在地图上显示”），点击即可重新显示线条。',
  'help.guide.tour-import-plan-tab.step.2': '点击列表顶部的“导入 GPX 或 KML”，选择你的文件（GPX、KML 或 KMZ）。',
  'help.ctx.trip-tour-detail.bullet.2':
    '标题区包含路线的圆形图块、带铅笔图标可重命名的名称、表示线条颜色的彩色圆点，以及显示类型、来源、计划用时、距离、爬升和下降的标签。右侧的 X 用来关闭卡片，按 Esc 也可以。',
  'help.guide.tour-detail-read.step.3': '把鼠标停在时间上，可以看到它的构成：行进时间、休息和计划总用时。',
  'help.guide.tour-detail-read.tip.4':
    '这张卡片不会改变路线。要移动某个点或重画某一段，请打开“游览”标签页，点击“本次旅行的游览活动”下的这条路线。',
  'help.guide.tour-rename-colour.step.4':
    '选择一种颜色。第一格“自动颜色”会把线条恢复为默认颜色，最后一格“选择自定义颜色”可使用任意颜色。地图上的线条和“游览”列表中的色条会立即跟着变化。',
  'help.guide.tour-take-along.step.3':
    '点击“GPX”，把已保存的路线下载为 GPX 文件：包含完整路线和已有的海拔数据，可直接用于导航应用或 GPS 设备。',
  'help.guide.tour-copy-keep.step.1':
    '打开路线的卡片，点击底部的“复制”。TREK 会创建一条新的、独立的、不带日期的路线，原路线保持不变。',
  'help.guide.tour-copy-keep.result':
    '旅行里多了一条可以随意修改的路线，收藏里保留着它自己的副本，随时可以添加到另一个旅行。',
  'help.guide.tour-packing-link.tip.1':
    '这只是一个链接，不会复制或移动任何内容，物品仍留在“列表”中。在那里勾选一件，路线上会立即显示。',
  'help.guide.tour-files.step.3': '点击文件即可打开。',
  'help.guide.tour-activity-link.step.3': '在“轨迹”下选择录制的轨迹，或点击“导入 GPX”导入新文件。',
  'help.guide.tour-activity-compare.goal': '查看实际轨迹与计划有哪些不同，并可更换或取消关联。',
  'help.guide.tour-origin-check.title': '查看路线的来源',
  'help.guide.tour-origin-check.result': '你会知道这条路线来自哪里、是什么时候来的，以及之后有没有变化。',
  'help.ctx.trip-tour-planner.bullet.6':
    '未保存的草稿会保留：再次打开“游览”标签页时它会恢复，并标有“已恢复未保存的草稿”。“返回游览列表”和“放弃”在丢弃更改前都会先询问你。',
  'help.guide.tour-open-workspace.step.6':
    '左下角的标签用来切换地图，起初是“地图”或“卫星影像”。打开路线后，它会提供该类型的地图，例如“地形图”或“徒步”，以及“放置点”和 3D 等开关。',
  'help.guide.tour-draw-route.step.1':
    '点击左侧栏顶部的“规划新游览路线”。左侧栏会变成“新游览路线”，除非你选了其他类型，否则默认是徒步。',
  'help.guide.tour-draw-route.tip.3':
    '如果草稿有未保存的更改，“添加行程”菜单中的“规划新游览路线”会先询问：“开始规划新游览路线？”，并提供“放弃并开始”。',
  'help.guide.tour-type-profile.step.4': '路线会按该配置重新规划，右侧的“游览概览”显示它的距离和用时。',
  'help.guide.tour-edit-points.step.3': '要调整顺序，把鼠标移到某一行上，拖动其左边缘出现的手柄。',
  'help.guide.tour-shaping-points.goal': '让路线改走另一条路，而不用添加站点。',
  'help.guide.tour-shaping-points.result': '路线会沿你拖到的位置走，站点编号与之前相同。',
  'help.guide.tour-loop-reverse.tip.3': '徒步时，它们旁边的“从起点规划环线”会按你选择的长度查找环线徒步。',
  'help.guide.tour-leg-by-hand.tip.1': '手动绘制的路段没有经过路径规划器检查，可能会穿过水域、私人土地或悬崖。',
  'help.guide.tour-trip-places.step.4':
    '它所在的行在名称下显示“行程地点”。“更多操作”中的“解除与地点的关联”会保留这个点，但取消关联。',
  'help.guide.tour-details-times.step.2': '在“详情”下填写“描述”，如果有网站，再添加“网站”。',
  'help.guide.tour-save.goal': '把画好的路线保存在旅行中。',
  'help.guide.tour-save.result': '路线已保存在旅行中，随时可以安排到某一天。',
  'help.guide.tour-edit-saved.tip.2':
    '导入的 GPX 或 KML 轨迹会以“GPX 游览路线”的形式打开，仅供查看。点击那里的“规划可编辑版本”，就能得到可以修改的路线。',
  'help.guide.tour-summary-profile.step.4': '标题旁的箭头即“收起海拔剖面图”，点击会隐藏剖面图，再点击一次可重新显示。',
  'help.guide.tour-list-manage.step.2':
    '把鼠标移到某条路线上，点击它那一行的圆形加号，即“添加到当天”，打开旅行的各天。',
  'help.guide.tour-delete.title': '删除路线',
  'help.guide.tour-saved-elsewhere.title': '路线在别处被保存时',
  'help.guide.tour-saved-elsewhere.result': '除非有人选择放弃，否则不会丢失任何更改。',
  'help.guide.tour-import-gpx.title': '把 GPX、KML 或 KMZ 文件导入为路线',
  'help.guide.tour-import-gpx.tip.2': '文件中的每条轨迹或路线都会成为一条独立的路线，轨迹不会被合并。',
  'help.guide.tour-view-import.step.2':
    '左栏将它显示为“GPX 游览路线”：“游览概览”中有距离、海拔和录制时间，下方是海拔剖面图。地图上显示它的线条。',
  'help.guide.tour-plan-from-import.step.1':
    '在“游览”标签页中打开导入的路线。在左侧的“可编辑版本”卡片中，点击“规划可编辑版本”。',
  'help.guide.tour-plan-from-import.result': '路线现在有了可拖动的路点，其“来源”显示为“已重新规划，记录的轨迹已保留”。',
  'help.guide.tour-restore-recorded.result': '路线重新变回 GPX 游览路线，并显示录制时的线条。',
  'help.guide.tour-take-over.step.6': '点击“引入”。',
  'help.guide.tour-import-wanderer.step.2':
    '在“搜索步道”中输入内容。“搜索此地图区域”只显示延伸到当前地图可见范围内的路线。',
  'help.ctx.trip-tour-map.title': '路线地图',
  'help.guide.tour-map-layers.goal':
    '选择最适合该类路线的地图来规划：看爬升用等高线，看标记步道或自行车路线，或者用航拍影像。',
  'help.guide.tour-along-search.title': '沿路线查找地点',
  'help.guide.tour-along-search.tip.1':
    '修改路线、类型或距离后，“重新搜索”会高亮显示，并提示列表是按之前的路线查找的。点击它即可更新列表。',
  'help.guide.tour-along-add-stop.step.4':
    '路线会重新规划为经过该地点，“沿途”会说明路线增加了多少距离和时间。同一行中的“撤销”可再次移除这个站点。',
  'help.guide.tour-3d-terrain.step.2':
    '路线按坡度着色。点击底部一行中的“坡度”，可改用路线自己的颜色绘制，再点一次则恢复坡度颜色。',
  'help.guide.tour-3d-flyover.title': '沿路线飞越',
  'help.guide.tour-3d-flyover.tip.2':
    '只有整条路线沿线的地貌都加载完成后，飞越才会开始，因此不会在途中停下来加载地图数据。把鼠标停在圆环上可查看加载进度。',
  'help.guide.tour-map-overlays.result': '雪道或航标会绘制在地图上，图例会说明它们的含义。',
  'help.ctx.trip-tour-stages.bullet.3':
    '“游览概览”在“阶段”下列出每个阶段，从起始站点到结束站点。点击某个阶段，会选中它的最后一个站点，并在海拔剖面图中标出该位置。',
  'help.guide.tour-multi-day.step.4':
    '“路点”现在分成“阶段 1”和“阶段 2”，各带有距离和时间。结束一个阶段的站点带有月亮图标。',
  'help.guide.tour-stages-on-days.title': '把多日路线安排到旅行的各天',
  'help.guide.tour-stages-on-days.tip.1':
    '如果旅行在最后一个阶段之前就结束了，选项会说明最多能安排到哪个阶段。之后的阶段不会分配日期。',
  'help.ctx.trip-tour-hike.bullet.2':
    '“路点”按顺序列出站点。“添加地点”一开始就是开启的，所以点击地图会放置下一个点。旁边的“行程地点”可以把旅行中的山屋或酒店变成站点。',
  'help.guide.tour-hike-plan.step.2': '打开“路线类型”并选择“徒步”：步行，难度由你设定。',
  'help.guide.tour-hike-plan.tip.3':
    '难度下方的“路线偏好”用来设置路线倾向：“避开陡坡”“避开台阶”和“避开渡轮”。如果没有其他路可走，路线仍会经过那里。',
  'help.guide.tour-hike-trail-details.step.5':
    '点击“路面”，可以按所走的路面来查看同一条路线，从柏油路到自然地面和岩石。',
  'help.guide.tour-hike-round.step.2':
    '“环线徒步”卡片会在地图上方打开。在“从”下核对起点，并输入想要的“距离”。旁边的标签显示环线可能的长度范围。',
  'help.guide.tour-hike-compare-ways.title': '比较徒步某一路段的其他走法',
  'help.guide.tour-hike-compare-ways.tip.2':
    '如果路径规划器找不到其他路，卡片会说明。如果它无法沿用你选的路，该路段保持原样，卡片也会告诉你。',
  'help.guide.tour-ferrata-add.step.5':
    '右侧的“游览概览”会显示带难度的“飞拉达”徽章，编辑器标题处也会提醒“路线经过飞拉达”。',
  'help.guide.tour-run-plan.step.1': '点击“规划新游览路线”，打开“路线类型”并选择“跑步”。',
  'help.guide.tour-run-plan.tip.3': '如果你的距离单位是英里，配速也按每英里计算。',
  'help.guide.tour-run-ways.tip.1': '这里的任何内容都不会改变跑步路线或用时。',
  'help.ctx.trip-tour-walk.bullet.5':
    '“本次旅行的游览活动”中的“添加行程”可以导入从 Google Maps 分享的步行路线。在“计划”标签页中，从某一天打开的漫步，可以让你为那一天勾选它的站点。',
  'help.guide.tour-walk-plan.step.6':
    '右侧的“游览概览”显示“预计时间”“停留点”和“计划中”，后者是前两项之和。点击左栏底部的“保存”，保存这条漫步。',
  'help.guide.tour-walk-sights.step.2':
    '选好主题后会自动填入“要找什么”。打开它可以勾选或取消各种类型，并在“距路线的范围”下选择查找多远。',
  'help.guide.tour-walk-day-times.title': '查看当天的到达时间和营业时间',
  'help.guide.tour-walk-day-times.tip.3':
    '营业时间来自 OpenStreetMap，或来自站点所对应的行程地点，旁边的标签会说明是哪一种。出发前请核实。',
  'help.guide.tour-walk-google-import.step.4':
    '点击“作为漫步载入”。TREK 会自己规划站点之间的步行路线。点击“保存”保留这条漫步。',
  'help.guide.tour-walk-check-off.step.2':
    '滚动到“漫步站点”。每个站点都显示停留多久，如果漫步设置了开始时间，还会显示你几点到达。',
  'help.ctx.trip-tour-bike.summary':
    '在“游览”标签页的编辑器中打开的一条骑行路线：它按哪种配置规划、骑行时间、路线经过的路面，以及山地骑行路线的步道难度评级。',
  'help.guide.tour-bike-profile.step.2': '打开“路线类型”字段并选择“骑行”。',
  'help.guide.tour-bike-profile.tip.3':
    '如果某个点附近没有自行车能走的路，侧栏会提示“没有适合自行车的路通向点 N”。请移动该点，或在它前一个点上打开“更多操作”，选择“手动绘制下一段”。',
  'help.guide.tour-bike-surfaces.step.4':
    '在“道路类型”下，点击一行，例如“农用或林间道路”或“有车流的道路”，即可看到路线在哪些位置经过这类道路。',
  'help.guide.tour-bike-mtb-grades.step.1':
    '在编辑器中打开这条骑行路线，确认“配置”设为“山地”。只有在该配置下才会读取步道难度。',
  'help.ctx.trip-tour-ski.title': '滑雪与冬季路线',
  'help.guide.tour-ski-plan.goal':
    '沿着地图上标注的雪道、缆车和步道，规划一天的雪道滑行、一圈越野滑雪、一次滑雪登山或一次雪鞋徒步。',
  'help.guide.tour-ski-plan.tip.2':
    '“项目”旁的信息圆点说明 TREK 如何处理滑雪路线。其中和这里的任何地方都不涉及积雪、雪崩，也不说明雪道、缆车和步道是否开放。',
  'help.guide.tour-ski-options.step.3':
    '在“优先”下，选择“最快”“滑得最多”或“最轻松”。在“节奏”下，选择“悠闲”“普通”或“运动”，这会改变路径规划器给每条雪道估算的用时。',
  'help.guide.tour-ski-fix-leg.goal': '一键规划红色路段，或直接画成直线。',
  'help.guide.tour-ski-fix-leg.result': '不再有红色路段：每一段要么沿着雪道走，要么在两个点之间走直线。',
  'help.guide.tour-ski-summary.tip.3':
    '已保存的路线会按保存时的样子打开。移动一个点或更改一个选项，就会按当前的雪道数据重新规划。',
  'help.guide.tour-ski-pistes-layer.tip.1': '如果开关一直是灰色，并显示“放大地图以查看雪道”，请放大到滑雪场区域。',
  'help.guide.tour-ski-import.step.3':
    '选择“项目”，如果是“越野滑雪”，还要选择“技术”。在你选择之前，对话框会提示“选择项目以导入为滑雪轨迹”。',
  'help.ctx.trip-tour-paddle.title': '划桨游',
  'help.guide.tour-paddle-setup.title': '规划划桨游',
  'help.guide.tour-paddle-setup.step.7': '确认“添加地点”已开启，然后点击地图：先点下水点，再点途中的各个点和上岸点。',
  'help.guide.tour-paddle-water-route.step.1':
    '手动绘制的路段会在其点下方显示“手动绘制，未规划”及其长度。TREK 会保持你画的线条不变。',
  'help.guide.tour-paddle-water-route.tip.4': '有路段未规划时无法保存。请先沿水路规划它，或手动绘制。',
  'help.guide.tour-paddle-portage.step.5':
    '在“上岸与下水”下，输入你上岸、卸货和重新下水所需的分钟数。留空则按 10 分钟计算。',
  'help.guide.tour-paddle-lock.step.2': '选择“此处有船闸”。该点下方会出现一张船闸卡片，标有“缺少时间”。',
  'help.guide.tour-paddle-time.goal': '查看水上航行、搬运、船闸和休息如何累加，并设置你自己的数值。',
  'help.guide.tour-paddle-time.tip.3':
    '休息时间和你自己的计划总用时在“详情”下设置。设置了计划总用时后，卡片会在估算值旁边显示“你的计划总时长”。',
  'help.guide.tour-paddle-wind.tip.1':
    '只有未来 16 天有预报。更远的日期会说明从哪天起有预报，过去的日期则说明该日已经过去。',
  'help.guide.tour-paddle-checklist.step.2':
    '下方的一行说明数据有多新：“OSM 数据截至”指 OpenStreetMap，“获取时间”指 TREK 读取数据的时间，“障碍物数据”则表示数据没有覆盖整条路线的情况。',
  'help.guide.tour-paddle-checklist.tip.5':
    '检查清单不代表安全或法律上的许可。你的决定不会解除 OpenStreetMap 中记录的禁令或私有土地限制。',
  'help.guide.tour-paddle-track-marks.step.5': '点击“陆上搬运”，然后在线条上点击你上岸的位置和重新下水的位置。',
  'help.ctx.trip-tour-horse.summary':
    '骑马游不做路径规划。路线由 OpenStreetMap 已知的有路标的马道路段拼成，中间用你手动绘制的路段连接，或者完全按你的录制保留。',
  'help.guide.tour-horse-plan.step.1': '把想骑行的区域显示在地图上，然后点击左栏顶部的“规划新游览路线”。',
  'help.guide.tour-horse-plan.tip.1':
    '马道不等于允许骑行。“马匹通行”只反映 OpenStreetMap 上的标记，请始终遵守现场的标志。',
  'help.guide.tour-horse-gap.step.2': '打开“用手动路段连接”。缺口会画成直线，且不做检查。',
  'help.guide.tour-horse-recorded.goal': '导入你用 GPS 设备或应用录制的骑行，并完全按你骑行时的样子保留。',
  'help.guide.tour-horse-recorded.tip.3': '你也可以把文件拖到“游览”标签页的任意位置，打开同样的预览。',
  'help.guide.create-trip.tip.3': '在“旅伴”下，可以添加已经在这里注册了账号的人。旅行一创建，他们就会成为成员。',
  'help.guide.trip-reminder.step.1': '点击旅行卡片上的铅笔图标。新旅行的“新建旅行”表单中也有同样的区块。',
  'help.guide.company-holidays.tip.2': '整天的公司假日会清除当天已登记的所有休假，这样就没有人会为这一天占用年假额度。',
  'help.guide.half-company-holiday.tip.2':
    '用相同的设置再点一次这一天可以清除它，关掉“半天”再点则会把它变成整天的公司假日。',
  'help.guide.edit-holiday-calendar.step.1': '打开“设置”，在“公共假日”或“学校假期”下找到这个日历。',
  'help.guide.person-color.goal': '给自己或一起规划的人换一个更容易区分的颜色。',
  'help.guide.answer-fusion-request.tip.2': '之后你们任何一方都可以解除合并，你的条目会保留。',
  'help.guide.log-for-partner.tip.2': '对方会立刻看到变化，对方的“年假额度”行也会马上更新。',
  'help.guide.country-places.title': '查看一个国家的所有地点',
  'help.guide.tour-activity-stats.step.1': '在地图底部的面板中，打开“统计”和“心愿单”旁边的“游览”标签页。',
  'help.guide.tour-activity-stats.tip.2':
    '在路线详情中用“添加实际轨迹”关联你实际走过的轨迹后，这里会用它的录制数值取代计划值。安排在多天的路线只计一次。',
  'help.ctx.collections.bullet.7':
    '保存的路线：从旅行中保存的路线排在列表最前面，显示难度、类型、来源旅行和各项测量数据。“添加到行程”会据此创建一条新路线，垃圾桶图标则把它从列表中移除。',
  'help.guide.move-to-list.title': '把地点移动或复制到另一个列表',
  'help.guide.copy-to-trip.tip.2': '旅行中已有的地点会被跳过，TREK 会告诉你跳过了多少个。',
  'help.guide.accept-list-invite.tip.2': '点击列表顶部的“已共享”可查看成员，在那里点击“退出列表”即可离开该列表。',
  'help.guide.tour-collection-add-to-trip.goal': '把列表中保存的路线变成你某个旅行里的新路线，可以带路点，也可以不带。',
  'help.guide.tour-collection-add-to-trip.result':
    '对话框会确认这条路线现在属于那个旅行。点击“打开行程”会带你过去，点击“关闭”则留在“收藏”。',
  'help.guide.tour-collection-manage.tip.3': '保存的路线只会出现在它们自己的列表中，不会出现在“全部已保存”里。',
  'help.guide.search-journey.step.3': '点击某一天可滚动到那里，点击它的箭头则会列出当天的条目，供你选择。',
  'help.guide.journey-map-layers.goal': '对比计划与实际发生的情况，并开关各个图层。',
  'help.guide.journey-keep-route.goal': '把某一天来自 Dawarich 的真实路线加到旅程地图上并保留下来。',
  'help.guide.journey-day-stays.goal': '把 Dawarich 记录的停留记录逐条变成条目。',
  'help.guide.journey-take-over-day.goal': '一步把某一天的停留记录变成草稿条目，或一份当日记述。',
  'help.guide.journey-auto-prepare.title': '让 TREK 提前整理你记录的日子',
  'help.guide.photo-location.title': '按照片的拍摄地点定位条目',
  'help.ctx.settings-about.summary':
    'TREK 是什么、这台服务器运行的版本，以及在哪里找到这个项目：文档、报告错误的地方和支持项目的方式。',
  'help.guide.startup.tip.2': '如果起始标签页属于你已关闭的扩展，则会改为打开“计划”。',
  'help.guide.web-push-device.title': '在本设备上接收推送通知',
  'help.guide.connect-airtrail.tip.1': '只有管理员开启了 AirTrail 扩展，才会出现这张卡片。',
  'help.guide.connect-dawarich.tip.1':
    'TREK 只会给出条目、地点和国家的建议，你确认之前不会添加任何内容，也不会往 Dawarich 写回任何内容。',
  'help.guide.tour-connect-wanderer.tip.1': '只有管理员在“游览”下允许了 wanderer，才会出现这张卡片。',
  'help.guide.tour-wanderer-watch.tip.1': '提示不会改动任何路线，路线的来源检查会显示究竟改了什么。',
  'help.guide.api-keys.tip.3':
    '把密钥以 Authorization: Bearer 或 X-API-Key 的形式发送到 /api/v1。一个账号最多可以有 10 个密钥。',
  'help.guide.plugin-settings.step.2': '“插件活动”按时间从新到旧列出插件代你执行的所有操作，点击“刷新”可加载最新记录。',
  'help.ctx.admin-github.bullet.3': '关于：Ko-fi、Buy Me a Coffee、Discord、“报告错误”、“功能建议”和 Wiki。',
  'help.guide.default-user-settings.goal': '为每个账号预设合理的单位、颜色模式和货币，无需用户自己打开“设置”。',
  'help.guide.default-map.step.3': '每个字段在你离开它时自动保存。字段名称旁的重置链接会恢复 TREK 的默认值。',
  'help.guide.own-routing-engine.tip.2':
    '只设置了你自己的路径规划服务时，也不会再使用公共 Valhalla。字段旁的重置链接可再次清空它。',
  'help.guide.admin-passkeys.step.1': '在“设置”标签页的“通行密钥登录”下，打开“启用通行密钥登录”。',
  'help.guide.storage-backends.step.4':
    '顶部的“健康”会列出写入镜像目标失败的记录。如果显示“未记录任何副本故障”，说明一切正常。',
  'help.guide.channels-instance.tip.3': 'Web 推送需要 HTTPS。在 iPhone 和 iPad 上，用户要先把 TREK 添加到主屏幕。',
  'help.guide.notification-defaults.step.1':
    '在“通知”标签页中，滚动到底部的“用户默认值”。每一行是一个事件，每一列是一个渠道。',
  'help.ctx.notifications.bullet.1':
    '右上角的铃铛显示你尚未阅读的通知数量。点击它可查看最新的十条，底部的“查看所有通知”则通向此页面。',
  'help.guide.read-notifications.step.2':
    '面板列出你最新的十条通知。每条都说明了谁在哪里做了什么，未读的背景带有底色。',
  'help.guide.filter-notifications.step.2': '在面板底部点击“查看所有通知”。',
  'help.guide.mark-notifications-read.tip.1': '通过通知上的按钮打开它，也会把它标为已读。',
  'help.guide.delete-notifications.tip.2':
    '删除的通知无法恢复。如果只想把通知收起来但保留，请把它标为已读，再用“未读”筛选。',
  'help.guide.notification-settings.tip.2': '没有按旅行单独设置的选项，一个开关对你所有的旅行都生效。',
  'help.guide.link-journal.title': '把日志关联到旅行',
  'help.guide.link-journal.tip.2': '此后，你授权的人也会在自己的旅程列表中看到这份日志。',
  'help.ctx.trip-places.bullet.8':
    '连接 Dawarich 后，列表顶部的“来自 Dawarich”会显示 Dawarich 在旅行期间记录的停留记录。“添加为地点”把一条停留记录变成地点，“我没有去过这里”则把它从列表中移走。',
  'help.guide.dawarich-stays.step.4':
    '如果某条停留记录并不是真正的到访，点击旁边的 x，即“我没有去过这里”，把它移走。列表底部的“显示……已处理过的”会显示你已添加或移走的停留记录，“放回来”可把移走的记录放回列表。',
  'help.guide.leave-stop-off-route.tip.1':
    '只有带坐标的站点才有这个选项，而且设置只对这一天有效，同一地点在另一天仍会参与路线规划。',
  'help.guide.move-booking-day.title': '把预订移到另一天',
  'help.guide.place-image-from-file.step.4': '这张照片现在就是地点的图片。点击它角上的红色小 X 可再次移除。',
  'help.guide.place-own-hours.step.2': '在“网站”下方，如果知道“电话”和“电子邮件”，就填上。',
  'help.guide.add-accommodation.tip.4':
    '更快的方法：当天标题中的 +（提示为“添加到当天”）里有“添加住宿”，它会打开当天，并直接展开这个表单。',
  'help.guide.confirm-stay-booking.goal': '直接在当天把住宿背后的酒店预订标记为已确认。',
  'help.guide.map-whole-trip.tip.4':
    '是否显示整个行程是按旅行保存在你的账号上的，所以换个浏览器打开，旅行也是同样的效果。',
  'help.guide.tour-map-lines.step.3':
    '在日期栏中打开路线所在的那一天，这条路线就会成为当天路线的一部分：路线先通向这条游览的起点，再从它的终点继续。',
  'help.guide.car-stops.goal': '为租来的车或你自己的车设置取车、还车，以及中途停靠的地点。',
  'help.guide.car-stops.tip.1': '没有单独的租车类型，租来的车和你自己的车都是“汽车”。',
  'help.guide.transport-details.result':
    '“计划”会在这段交通所在的日期打开，地图上画出它的线路，它那一行的路线图标也已开启。',
  'help.guide.export-transports-csv.step.2': '点击“视图选项”后面的电子表格图标，其提示文字是“导出为电子表格 (CSV)”。',
  'help.guide.group-sort-bookings.title': '对预订分组和排序',
  'help.guide.group-sort-bookings.tip.2': '在“时间线”中，同一个按钮里是“每种类型单独一行”和“同时显示另一个标签页”。',
  'help.guide.booking-on-map.result': '详情会关闭，“计划”标签页在预订所在的日期打开，并在地图上选中它的地点。',
  'help.guide.export-bookings-csv.step.1':
    '如果只想导出标签页的一部分，请先用“搜索”或“筛选”缩小范围。文件内容就是标签页当前显示的内容。',
  'help.guide.import-booking-file.tip.4':
    '读取确认文件需要联网。离线时，“导入”会提示这一点，等 TREK 重新联网后再试即可。',
  'help.guide.arrange-packing-list.step.1':
    '按住清单标题栏左端、颜色圆点前面的手柄，把清单拖到另一张卡片上。目标卡片会出现强调色的轮廓，清单随即取代那张卡片的位置，旅行中的每个人看到的都是这个顺序。',
  'help.guide.count-packed-pieces.title': '同一物品打包多件',
  'help.guide.count-packed-pieces.tip.2': '开启“行李追踪”后，“行李”卡片中的“已打包”只统计已经放入的件数。',
  'help.guide.packing-bags.tip.4':
    '由多人共同携带的包，其重量会在“每人”下平均分摊。这个重量带点状下划线，鼠标指向它时会显示相关说明。',
  'help.guide.expense-receipts.step.1': '点击支出所在行旁边的铅笔图标，编辑器随即打开，靠近底部就是“收据与发票”。',
  'help.guide.expense-receipts.tip.3': '附加收据需要联网，并且要有上传文件的权限，因为收据是作为旅行文件之一存储的。',
  'help.guide.files-sync-settings.title': '选择文档的同步方向',
  'help.guide.files-sync-settings.tip.1': '总有一个方向保持开启，只剩一个方向开着时，再点它不会有任何效果。',
  'help.guide.manage-notes.title': '阅读、置顶和编辑笔记',
  'help.guide.manage-notes.tip.1': '只有笔记有文字时，菜单里才有“展开”。无权编辑“协作”的成员只能看到“展开”。',
  'help.guide.note-categories.step.5':
    '点击“保存”。重命名或改了颜色的分类下的所有笔记会立即跟着变化，对每位成员都一样。“取消”会放弃你的更改。',
  'help.guide.trip-chat.tip.5': '聊天先显示最新的消息，点击顶部的“加载更早的消息”可载入更早的消息。',
  'help.guide.roadtrip-reorder.result':
    '站点按你设定的顺序排列，你调整过的每一天的距离、驾驶时间和到达时间都会重新计算。',
  'help.guide.roadtrip-overnight.goal': '在路上找个睡觉的地方，并把这一晚作为预订加到行程中。',
  'help.guide.roadtrip-overnight.tip.2':
    '在卡片中点击“编辑”，把已预订的一晚改回“停留”时，会先问“取消这次过夜？”。点击“改为休息”会移除这一晚，包括它的预订和与之关联的支出，站点则保留在行程中。',
  'help.guide.roadtrip-stop-fill.tip.2': '如果选的值和该站点已有的一样，站点就会恢复为你的默认值。',
  'help.guide.roadtrip-bookings.tip.1':
    '枢纽处的时间会比时刻表提前，留出值机时间：航班或邮轮提前一小时，渡轮提前半小时，火车或巴士提前十分钟。',
  'help.guide.roadtrip-google-import.step.2': '粘贴你从 Google 地图分享的路线链接，然后点击“预览”。',
  'help.guide.roadtrip-hazards.goal': '在地图上查看行车路线周边的天气警告和灾害提醒。',
  'help.ctx.trip-tours.title': '计划中的路线',
  'help.guide.tour-show-list.title': '在计划中显示旅行的路线',
  'help.guide.tour-show-list.tip.2':
    '还没有路线？列表顶部的“导入 GPX 或 KML”可导入文件，“游览”标签页上的“规划新游览路线”则创建新路线。',
  'help.guide.tour-add-to-day.step.4':
    '也可以把这一行从列表中拖出，放到左栏的某一天上。放在两个站点之间，它就会落在那个位置。',
  'help.guide.tour-day-times.goal': '查看路线何时结束，以及是否与当天接下来的安排重叠。',
  'help.guide.tour-day-times.tip.4':
    '同一菜单中的“保存到收藏”会把路线连同它的线路一起保存到收藏中，效果和卡片上的“收藏”按钮一样。',
  'help.guide.tour-remove-from-day.tip.2':
    '这些菜单和卡片上都没有“删除”。删除路线要在“游览”标签页，用“本次旅行的游览活动”下那一行的垃圾桶。',
  'help.guide.tour-filter-list.tip.1': '“路线上限”是规划路线时允许的最高难度，不是在步道上实测的难度。',
  'help.guide.tour-hide-on-map.step.3':
    '只要有路线被隐藏，列表上方就会出现一行“已在地图上隐藏”，并显示数量。点击“全部显示”可一次恢复所有路线。',
  'help.guide.tour-import-plan-tab.step.3':
    '“导入预览”会在保存之前显示每条轨迹。在“导入为”下选择类型（徒步、骑行等），然后点击“导入 1 条路线”。',
  'help.ctx.trip-tour-detail.bullet.3':
    '下面依次是：“旅行日期”（路线所在的每一天一个图块）、带海拔剖面图的各项测量数据，然后按实际情况显示：城市漫步的站点、划桨游的检查和风、“实际轨迹”、“行李清单”、“描述”、“笔记”、“来源”和“文件”。',
  'help.guide.tour-detail-read.step.4':
    '“旅行日期”为路线所在的每一天显示一个带日期的图块。如果显示“不在旅行的任何一天”，说明它还没有安排。',
  'help.guide.tour-detail-read.tip.5': '在手机上，卡片会以从底部弹出的面板形式打开，方便阅读，也方便带着路线出发。',
  'help.guide.tour-rename-colour.tip.1':
    '名称和颜色属于旅行，所以其中的每个人都能看到。如果只想在自己的地图上隐藏某条路线，不影响其他人，请用“游览”列表中的眼睛图标。',
  'help.guide.tour-take-along.tip.1':
    '在能分享文件的设备上，GPX 旁边会出现“分享”，可以把同一个文件直接发给另一个应用。',
  'help.guide.tour-copy-keep.step.2': '副本会立刻打开，名称是原名称加上（副本）。点击铅笔图标可以给它起个自己的名字。',
  'help.guide.tour-packing-link.title': '把路线关联到行李清单',
  'help.guide.tour-packing-link.tip.2':
    '区块标题中的“更换”可以让路线改为关联另一个清单。该对话框中的“移除关联”会取消关联，清单本身保持不变。',
  'help.guide.tour-files.tip.1': '这些文件同时也是旅行的文件，所以也会显示在“文件”标签页中。',
  'help.guide.tour-activity-link.step.4': '在“实际”下核对它测得的数据，然后点击“关联”。',
  'help.guide.tour-activity-compare.step.1':
    '打开路线的卡片。“计划与实际”把计划的距离、累计爬升、累计下降和含休息时间，与轨迹的对应数值并排列出，并给出“差值”。',
  'help.guide.tour-origin-check.goal':
    '查明一条路线是在 TREK 中绘制的还是导入的、来自哪个文件，以及之后有没有被修改过。',
  'help.ctx.trip-tour-planner.title': '游览',
  'help.guide.tour-open-workspace.title': '熟悉“游览”标签页',
  'help.guide.tour-open-workspace.step.7':
    '点击右侧栏中的一条路线。在 TREK 中规划的路线会在编辑器中打开，导入的轨迹则保持原样，以“GPX 游览路线”的形式打开，仅供查看。',
  'help.guide.tour-draw-route.step.2': '在“搜索地点或地址”中输入路线的起点并选择结果，地图会移到那里。',
  'help.guide.tour-draw-route.tip.4':
    '未保存的草稿会保留。再次打开旅行的“游览”标签页，草稿会恢复，并标有“已恢复未保存的草稿”。',
  'help.guide.tour-type-profile.tip.1': '更改类型在历史记录中算一步：侧栏顶部的“撤销路线点编辑”会恢复旧类型及其路线。',
  'help.guide.tour-edit-points.step.4': '或者打开该行上的“更多操作”（三个点），选择“上移路线点”或“下移路线点”。',
  'help.guide.tour-shaping-points.step.1':
    '在地图上点击已画出的路线中希望改走别处的位置，那里会出现一个小圆点，这就是塑形点。',
  'help.guide.tour-loop-reverse.title': '做成环线或反转路线',
  'help.guide.tour-loop-reverse.result': '得到一条回到起点的环线，或沿相反方向走的同一条路线。',
  'help.guide.tour-leg-by-hand.tip.2':
    '如果某个点没有任何道路能到达，会出现提示，带有“显示该点”按钮和点的编号。请把这个点移到道路上，或手动绘制通往它的路段。',
  'help.guide.tour-trip-places.tip.1': '已经在路线中的地点会标为“已在路线中”，不能重复选择。',
  'help.guide.tour-details-times.step.3': '填写“休息”，例如 0:45。休息时间会加到估算用时上。',
  'help.guide.tour-save.step.1': '在“游览名称”中输入名称。没有名称时，“保存”保持灰色。',
  'help.guide.tour-edit-saved.title': '修改已保存的路线',
  'help.guide.tour-edit-saved.tip.3': '侧栏顶部的“下载 GPX”和“保存到收藏”要在更改保存之后才能使用。',
  'help.guide.tour-summary-profile.tip.1': '点击卡片自己的标题可以折叠整个概览。',
  'help.guide.tour-list-manage.step.3': '选择日期。路线会加到那一天，它所在的行上会显示该日期。',
  'help.guide.tour-delete.goal': '把路线从旅行中彻底删除。',
  'help.guide.tour-saved-elsewhere.goal': '当你在修改路线时别人已经保存了它，决定怎么处理。',
  'help.ctx.trip-tour-import.title': '导入路线',
  'help.guide.tour-import-gpx.goal': '把 GPS 手表、应用或 Google 地球中的轨迹变成旅行中的一条路线，保存前会先检查。',
  'help.guide.tour-import-gpx.tip.3': '旅行中已有的轨迹会显示为灰色的“已在行程中”，并被跳过。',
  'help.guide.tour-view-import.step.3': '点击左上角的箭头“返回游览列表”，可再次关闭它。',
  'help.guide.tour-plan-from-import.step.2':
    'TREK 会从轨迹中取出控制点并重新规划路线。地图用虚线画出导入的轨迹，用实线画出建议的路线，卡片则对比两者的长度、“在轨迹 50 米内”的占比以及“最大偏差”。',
  'help.guide.tour-restore-recorded.title': '回到录制的轨迹',
  'help.guide.tour-take-over.title': '从其他旅行引入路线',
  'help.guide.tour-take-over.tip.1':
    '副本是一条独立的路线，还没有安排到任何一天，之后对原路线或副本的修改互不影响。它的“来源”会写明是从哪个旅行引入的。',
  'help.guide.tour-import-wanderer.step.3':
    '点击一条步道。它会显示在地图上，栏中会显示其 GPX 文件的测量数据、描述，以及它在 wanderer 中是公开还是私有。',
  'help.ctx.trip-tour-map.summary':
    '“游览”标签页中间的地图，针对你打开的那条路线：适合其类型的地图、叠加在上面的雪道或航标、沿路线的地点，以及在真实地貌上显示的同一条路线的 3D 视图。',
  'help.guide.tour-map-layers.step.1':
    '打开“游览”标签页，点击右侧“本次旅行的游览活动”下的一条路线。它会在规划器中打开，地图左下角的标签列出这类路线可用的地图。',
  'help.guide.tour-along-search.goal': '在你正在规划的路线附近查找观景点、水源、山屋或吃饭的地方。',
  'help.guide.tour-along-search.tip.2': '城市漫步时，列表上方的四个主题会自动为你选好合适的类型。',
  'help.guide.tour-along-add-stop.result':
    '路线现在会经过该地点，“游览概览”中显示新的距离和用时。保存路线即可保留这项更改。',
  'help.guide.tour-3d-terrain.step.3':
    '点击右侧的“坡度分布”标签。展开后会显示路线中“低于 5 %”“5 至 10 %”“10 至 18 %”“18 至 27 %”和“27 % 及以上”各占多少。折叠时则显示最高点和最陡的一段。',
  'help.guide.tour-3d-flyover.goal': '在步行、骑行或滑雪之前，先从头到尾看一遍整条路线。',
  'help.guide.tour-3d-flyover.tip.3': '飞行暂停时，沿海拔剖面图移动，圆点会跳到对应位置，点击“播放飞越”即从那里继续。',
  'help.guide.tour-map-overlays.tip.1':
    '雪道是地图数据，不是实时信息：它不说明哪些雪道开放或已压雪，也不说明积雪和雪崩情况。缩小到滑雪场范围之外时，开关会显示“放大地图以查看雪道”。',
  'help.ctx.trip-tour-stages.bullet.4':
    '在“本次旅行的游览活动”中，多日路线会显示一个月亮图标和阶段数。这个按钮即“显示阶段”，点击会展开阶段列表，显示每个阶段所在的日期和“整条路线”的合计。',
  'help.guide.tour-multi-day.step.5':
    '“游览概览”在“阶段”下列出每个阶段。点击其中一个，可以看到它在哪里结束：它的最后一个站点会被选中，海拔剖面图也会标出该位置。',
  'help.guide.tour-stages-on-days.goal': '把每个阶段分别安排到不同的一天，或把整条路线安排在同一天。',
  'help.guide.tour-stages-on-days.tip.2':
    '在已经安排了这条路线的那一天，“整条路线放在这一天”是灰色的。“从这一天起按阶段安排”在那里仍然可用，并会取代当天的整条路线。',
  'help.ctx.trip-tour-hike.bullet.3':
    '“路点”卡片的标题栏里有路线工具：“反转方向”“返回起点”，徒步时还有“从起点规划环线”。站点上的“更多操作”里有“比较下一段的道路”。',
  'help.guide.tour-hike-plan.step.3': '在“游览名称”下输入名称。',
  'help.guide.tour-hike-plan.tip.4':
    '步行时间按徒步路标规则（DIN 33466）计算，不含休息。请在“详情”的“休息”中添加休息时间，它们会计入计划总用时。',
  'help.guide.tour-hike-trail-details.result':
    '你会知道徒步路线的哪些路段是什么难度等级、路面是什么材质，以及它们在地图上的位置。',
  'help.guide.tour-hike-round.step.3': '点击“查找环线”。环线 A、环线 B 等会出现在列表和地图上，各用自己的颜色。',
  'help.guide.tour-hike-compare-ways.goal': '查看徒步在两个站点之间还能走哪些其他小路，并改走其中一条。',
  'help.guide.tour-hike-compare-ways.tip.3': '点击“取消”会关闭卡片，路线保持不变。',
  'help.guide.tour-ferrata-add.result':
    '徒步路线会沿着来自 OpenStreetMap 的飞拉达自身线路前进。点击地图可从顶端继续。路径规划器只规划通往飞拉达和离开飞拉达之后的路。',
  'help.guide.tour-run-plan.step.2':
    '选择“配置”：“跑步”适合城镇、公园和河边多为铺装的道路，“越野跑”适合林间道路和自然小路。',
  'help.guide.tour-run-plan.tip.4': '“越野跑”最多使用山路难度（T2）的小路，不会选更难的。',
  'help.guide.tour-run-ways.tip.2':
    '把“配置”切换为“越野跑”，路线会走更多自然小路；切换为“跑步”，路线则尽量保持在坚实的路面上。',
  'help.guide.tour-walk-plan.title': '逐站规划城市漫步',
  'help.guide.tour-walk-plan.tip.1':
    '站点编号外面的圆环表示重要程度：“必去”是实线，“可选”是虚线。带小盾牌的是“受保护”的站点。',
  'help.guide.tour-walk-sights.step.3': '点击“沿途搜索”。名称前带星标的是“亮点”，即这里最知名的地点之一。',
  'help.guide.tour-walk-day-times.goal': '了解在漫步当天你几点到达每个站点，以及哪些地方那时已经关门。',
  'help.guide.tour-walk-day-times.tip.4':
    '同一天有两条漫步：在“计划”标签页中，点击它们之间的路段（“更改出行方式”），选择“公共交通”。搜索会从第一条漫步结束的地点和时间开始，如果换乘在第二条漫步开始之后才到，会给出警告。',
  'help.guide.tour-walk-google-import.tip.1': '只会读取按步行规划的路线。分享之前，请先把 Google 地图切换到步行。',
  'help.guide.tour-walk-check-off.step.3': '对已经看过的站点点击“标记为已去过”，对不想去的站点点击“跳过”。',
  'help.ctx.trip-tour-bike.bullet.1':
    '“路线类型”下的“配置”决定路径规划器按哪种骑行方式规划：旅行、公路、砾石或山地。下面一行说明路径规划器在找什么，改动后会重新规划整条路线。',
  'help.guide.tour-bike-profile.step.3':
    '在“配置”下选择“旅行”“公路”“砾石”或“山地”。下面一行说明路径规划器在该配置下找什么。',
  'help.guide.tour-bike-profile.tip.4': '在路线有了名称、路线及其海拔都计算完成之前，“保存”保持灰色。',
  'help.guide.tour-bike-surfaces.result':
    '地图会标出你所选那一行对应的路段，你就知道路线走的是什么路面。路线本身保持不变。',
  'help.guide.tour-bike-mtb-grades.step.2':
    '在“路面与道路”卡片中查看“路径难度（mtb:scale）”：显示路线中从“S0，无特别难度”到“S4 及以上，专家级地形”各占多少。',
  'help.ctx.trip-tour-ski.summary':
    '“游览”标签页中类型为“滑雪与冬季”的路线：一天的雪道滑行、一圈越野滑雪、一次登山滑雪、一次雪鞋徒步或一次冬季漫步。路段沿着 OpenStreetMap 中标注的雪道、缆车和步道，由雪道路径规划器按你的项目和限制来规划，录制的滑雪轨迹则连同其项目一起导入。',
  'help.guide.tour-ski-plan.step.1': '在“游览”标签页中，点击左侧栏顶部的“规划新游览路线”。',
  'help.guide.tour-ski-plan.tip.3': '之后更改项目，会保留你的点，并按该项目使用的选项重新规划各路段。',
  'help.guide.tour-ski-options.step.4':
    '使用这些开关：“乘坐缆车”“允许野雪路线”“需要时乘缆车下山”和“避开推测的连接”。“越野滑雪”还有“仅限压雪道”和“仅限有照明的雪道”，“登山滑雪”还有“沿雪道边缘上行”。',
  'help.guide.tour-ski-fix-leg.step.1':
    '路径规划器无法规划的路段，会在其点下方显示一行红色提示和原因，例如“只有被你排除的缆车才能连接这些点”，并指出涉及的雪道或缆车。',
  'help.guide.tour-ski-summary.title': '查看滑雪路线的雪道走向',
  'help.guide.tour-ski-summary.tip.4': '卡片底部会写明滑雪场，以及规划这条路线时所用地图数据的日期。',
  'help.guide.tour-ski-pistes-layer.tip.2': '如果雪道加载失败，开关上会出现警告标记。地图和你的路线仍可正常使用。',
  'help.guide.tour-ski-import.step.4': '点击“导入 1 条路线”。',
  'help.ctx.trip-tour-paddle.summary':
    '河流或湖泊上的皮划艇、独木舟或 SUP 路线。它会写明船型和水域，在 TREK 有数据的地方沿水路前进，把陆上搬运和船闸计入用时，并显示你划行当天的风，以及沿途障碍物的已知情况。',
  'help.guide.tour-paddle-setup.goal': '创建一条皮划艇、独木舟或 SUP 路线，并设定划什么船、在什么水域、速度多快。',
  'help.guide.tour-paddle-setup.tip.1': '“船”设为“其他”时没有建议速度。请自己输入一个，否则水上用时会一直为空。',
  'help.guide.tour-paddle-water-route.step.2': '想让某一段沿水路规划，请指向它前面的站点，点击“更多操作”，即三个点。',
  'help.guide.tour-paddle-water-route.result':
    '每一段要么沿着水路，要么是你有意手动绘制的，TREK 无法规划的路段会说明原因。',
  'help.guide.tour-paddle-portage.tip.1':
    '如果想改回划行这一段，再次打开该点的“更多操作”，选择“这一段改回划行”。它会变回手动绘制的路段。',
  'help.guide.tour-paddle-lock.step.3': '点击船闸卡片将它展开。',
  'help.guide.tour-paddle-time.step.1': '“用时估算”位于左栏路点下方。标题中的徽章是总用时，已包含休息。',
  'help.guide.tour-paddle-time.result': '估算会按你输入的内容计算，并指出还缺少什么。',
  'help.guide.tour-paddle-wind.tip.2':
    '安排在多天的路线，卡片标题中会为每一天显示一个日期标签。点击其中一个可查看那一天。',
  'help.guide.tour-paddle-checklist.step.3':
    '条目沿着路线排列：来自 OpenStreetMap 的堰坝、船闸、急流、下水点和通行规则，以及你自己添加的陆上搬运和船闸（标有“自行规划”）。',
  'help.guide.tour-paddle-checklist.result': '路线上的每个条目都有了结论，你也读过了安全提示。',
  'help.guide.tour-paddle-track-marks.step.6': '点击“船闸”，然后点击线上船闸所在的位置。',
  'help.ctx.trip-tour-horse.bullet.1':
    '在编辑器中把“路线类型”设为“骑马游”，左栏就会出现“骑马路线”卡片。“在地图视图中查找”会列出当前地图视图内的路线。',
  'help.guide.tour-horse-plan.step.2':
    '点击“游览名称”下的“路线类型”字段，选择“骑马游”。“骑马路线”卡片会出现在“路点”下方。',
  'help.guide.tour-horse-plan.tip.2':
    'TREK 不会为骑行估算用时。如果想在当天显示时间，请在“详情”的“计划中”下自己填一个。',
  'help.guide.tour-horse-gap.step.3': '点击“采用路段”。开关没打开之前，按钮保持灰色。',
  'help.guide.tour-horse-recorded.step.1':
    '在“本次旅行的游览活动”中，点击“添加行程”（+），选择“导入 GPX 或 KML”，然后选取你骑行的文件。',
  'help.guide.dateless-trip.title': '规划没有日期的旅行',
  'help.guide.trip-reminder.step.2':
    '在“提醒”下选择 1、3 或 9 天。需要其他提前天数时，点击“自定义金额”，输入 1 到 30 之间的天数。',
  'help.guide.upcoming-reservations.title': '跳转到接下来的预订',
  'help.guide.half-company-holiday.title': '标记半天的公司假日',
  'help.guide.edit-holiday-calendar.step.2': '点击颜色方块选择新颜色，或输入新标签后按回车键。',
  'help.guide.person-color.step.1': '在“人数”卡片中，点击名字前面的彩色圆点。',
  'help.guide.answer-fusion-request.title': '回复合并请求',
  'help.guide.log-for-partner.title': '为一起规划的人登记休假',
  'help.guide.dissolve-fusion.title': '停止共同规划',
  'help.guide.country-places.goal':
    '列出 TREK 为某个国家计入的地点，方便你核对在那里去过哪些地方，或找出被归到错误国家的地点。',
  'help.guide.regions.tip.3': '“添加到心愿单”对地区同样适用。该地区会显示与心愿单中的国家相同的斜线填充。',
  'help.guide.tour-activity-stats.step.2':
    '用左侧的两个标签选择时间段和类型。“时间段”提供“全部时间”“今年”“最近 12 个月”，以及你有路线的每个往年。“类型”可以把数据缩小到某一种路线，或选“全部类型”。',
  'help.guide.tour-activity-stats.tip.3':
    '写明了参与者的那一天只计入这些人，没有写明任何人的那一天则计入旅行中的所有人。这个标签页读取的是实时数据，需要联网。',
  'help.guide.move-to-list.goal': '在列表之间移动地点，或把地点复制到另一个列表，重新整理你的列表。',
  'help.guide.accept-list-invite.result':
    '该列表会出现在侧栏的“已共享”下，并连同其中的地点一起打开。其他成员所做的更改会实时显示。',
  'help.guide.tour-collection-add-to-trip.step.1':
    '打开列表。保存的路线排在最前面，位于地点上方。点击路线上的“添加到行程”，或点击该行本身。',
  'help.guide.tour-collection-manage.title': '查找并移除保存的路线',
  'help.guide.tour-collection-manage.result': '路线已从列表中移除，并有一条简短提示确认。',
  'help.guide.entry-draft.title': '把条目保留为草稿',
  'help.guide.journey-map-layers.step.1':
    '地图顶部的图层栏有“计划”“记录”“条目”和“照片”，每项都标有数量。点击某一项可隐藏或显示它。',
  'help.guide.journey-keep-route.step.1': '在当天的标题栏中，点击 Dawarich 按钮，即“导入记录”。',
  'help.guide.journey-day-stays.step.1':
    '有待处理停留记录的那一天，末尾有一行提示，例如“来自 Dawarich 的 4 条停留记录”和时间跨度。点击它即可展开停留记录。',
  'help.guide.journey-take-over-day.step.1':
    '点击当天停留记录行末的“导入当天”，或点击当天标题栏中的列表按钮，按钮上会显示有多少条停留记录在等待。',
  'help.guide.journey-auto-prepare.goal': '旅行进行期间，让每天的停留记录自动准备好，供你查看。',
  'help.guide.photo-location.goal': '不用为每个条目逐个搜索地点，就能把条目放到地图上。',
  'help.ctx.settings-about.bullet.1': '此服务器运行的版本显示在标题旁边。',
  'help.guide.readability.tip.3': '“可读性”标有“实验性”。如果显示效果不对，点击标签页底部的“恢复默认”即可还原。',
  'help.guide.web-push-device.goal': '即使 TREK 已关闭，也能在手机或电脑上收到 TREK 的通知。',
  'help.guide.connect-airtrail.tip.2': '密钥以加密方式存储，之后不会再显示。字段中出现圆点，说明已经保存了密钥。',
  'help.guide.connect-dawarich.tip.2':
    '按钮下方，卡片会说明 TREK 上次检查的时间，以及你的 Dawarich 版本不支持哪些功能。',
  'help.guide.tour-connect-wanderer.tip.2': '位于私有地址的实例，可能需要管理员允许访问内部网络。',
  'help.guide.tour-wanderer-watch.tip.2':
    '“暂停至”表示 wanderer 没有响应，“令牌被拒绝”表示令牌需要通过连接测试，或需要换一个新令牌。',
  'help.guide.plugin-settings.result': '插件会按你的设置运行，它代你执行的每个操作都会列在“插件活动”下。',
  'help.ctx.admin-defaults.bullet.3':
    '你设置过的字段旁边有重置链接，可恢复 TREK 自己的默认值。用户自己的设置始终优先于这些默认值。',
  'help.ctx.admin-settings.bullet.5': '“危险区域”：“轮换 JWT 密钥”会让所有用户退出登录，包括你自己。',
  'help.guide.default-user-settings.step.1':
    '在“用户默认设置”下，选择“颜色模式”（浅色、深色或自动）、“温度单位”“距离单位”“时间格式”“每周开始于”“显示货币”，并设定“隐藏预订编号”是开还是关。每个选择都会立即保存。',
  'help.guide.admin-passkeys.step.2':
    '填写“Relying Party ID（域名）”，例如 trek.example.org，再填写访问你的 TREK 所用的“允许的来源”，然后点击“保存”。两项都留空则使用 APP_URL。',
  'help.guide.rotate-jwt-secret.title': '让所有人一次性退出登录',
  'help.guide.notification-defaults.step.2':
    '点击单元格，切换到下一个状态：开启、关闭、封锁。提示会写出下一个状态，每次点击都会立即保存。',
  'help.ctx.notifications.bullet.2':
    '顶部的“全部”和“未读”用来在所有通知和仅未读通知之间切换。向下滚动时，列表会继续加载更多。',
  'help.guide.read-notifications.step.3':
    '点击通知下方的按钮，例如“查看假期”，即可打开通知所涉及的内容，同时也会把它标为已读。',
  'help.guide.filter-notifications.step.3': '点击“未读”，只看尚未阅读的通知。点击“全部”可再次显示所有通知。',
  'help.guide.mark-notifications-read.tip.2': '标为已读只会改变底色和未读数量。通知会一直留在列表中，直到你删除它。',
  'help.guide.delete-notifications.result': '该通知已从列表和铃铛中消失。',
  'help.guide.notification-settings.result': '“设置”已打开“通知”，每个事件和渠道各有一个开关。',
  'help.guide.link-journal.goal': '在旅行内向你选定的人展示你的某本旅程日志。',
  'help.guide.link-journal.tip.3':
    '之后，“旅行设置”中的“旅程日志”提供“编辑访问权限”“更换日志”和“取消关联”。取消关联会移除这个标签页，你在日志本身中添加的人仍保留访问权限。',
  'help.guide.dawarich-stays.result':
    '这条停留记录成为旅行中的一个地点，位于你选择的那一天，或归入“未规划”，面板会把它标为已处理。',
  'help.ctx.trip-days.bullet.7': '旅行进行期间，计划会打开到今天并自动滚动到那里。',
  'help.guide.leave-stop-off-route.tip.2': '“从当天移除”会把站点从这一天取下，而“从路线中排除”则让它仍留在计划里。',
  'help.guide.move-booking-day.goal': '直接在计划里把交通或预订移到另一天，无需打开表单。',
  'help.guide.place-image-from-file.result': '这张照片会成为地点的图片，显示在卡片、地点栏、当天计划和地图上。',
  'help.guide.place-own-hours.step.3':
    '下方的“营业时间”显示一周，每天一行。如果 TREK 已找到该地点的营业时间，会自动填好，否则请先点击“添加营业时间”。填写每天的开门和关门时间，不营业的日子点击“已关闭”。',
  'help.guide.add-accommodation.tip.5': 'GPX 轨迹和路线地点永远不会作为住宿候选，只会提供旅行中的普通地点。',
  'help.guide.confirm-stay-booking.step.1':
    '打开你入住的那一天。在住宿卡片的“预订”下，可以看到这一晚的酒店预订，标有“待确认”或“已确认”。点击那个框。',
  'help.guide.tour-map-lines.step.4':
    '想把路线从地图上隐藏，请把右栏切换到“游览”，把鼠标指向该路线，点击眼睛图标，即“在地图上隐藏”。它的线条和图钉会从地图上消失，该行仍留在列表中，显示为暗色，并带一个划掉的眼睛图标（“在地图上显示”），点击即可重新显示。',
  'help.guide.car-stops.step.1': '在你取车那一天的标题栏中，点击 +（提示为“添加到当天”），选择“添加交通”。',
  'help.guide.car-stops.tip.2': '行车至少有两个经停点后，才会出现“上移”和“下移”。',
  'help.guide.transport-details.title': '打开一段交通并使用它的详情',
  'help.guide.transport-details.tip.1': '对已画出线路的行程，再次点击“在地图上”会关闭该线路。',
  'help.guide.export-transports-csv.result':
    '浏览器会保存一个以旅行命名的文件，例如 autumn-in-japan-transports.csv，每段行程一行，包含类型、标题、状态、开始、结束、出发地、目的地、地点、确认号和笔记。',
  'help.guide.group-sort-bookings.goal': '按状态、日期或类型，用你想要的顺序排列卡片或列表。',
  'help.guide.booking-on-map.tip.1':
    '只有带地点的预订才有“在地图上”。在表单的“地点 / 活动”下选一个地点，按钮就会出现。',
  'help.guide.export-bookings-csv.step.2':
    '打开“视图选项”（视图图标后面的滑块图标），在“排序方式”下选择一种顺序。各行会按此排列，每个预订一行，不分区。',
  'help.guide.edit-booking.tip.4':
    '如果你改过内容，点击表单外面或按 Esc 键，会询问“放弃更改？”。点击“继续编辑”即可回到表单。',
  'help.guide.arrange-packing-list.step.2':
    '在清单内部，行左侧的手柄可以上下拖动该物品。行左边缘的强调色线条显示它将落在哪里。',
  'help.guide.count-packed-pieces.goal': '给物品设置数量，并逐件标记已打包的件数。',
  'help.guide.count-packed-pieces.tip.3': '数量为一时不显示计数器，只有勾选框。',
  'help.guide.expense-receipts.step.2':
    '点击“收据与发票”旁边的“附加”，选择照片或 PDF，也可以一次选择多个。每个文件都列在标题下，旁边有一个垃圾桶，用来移除它。',
  'help.guide.files-sync-settings.goal':
    '决定文档是只从你的文档服务导入、只导出到它，还是双向同步，以及文档被删除或在两处都被修改时如何处理。',
  'help.guide.files-sync-settings.tip.2':
    '选择“询问我”后，在两处都被编辑过的文档会出现在卡片下方的“需要查看”中。点击“解决”，然后选择“保留 TREK 版本”“保留文档服务的版本”或“两份都保留”。',
  'help.guide.manage-notes.goal': '完整打开一条笔记，把重要的置顶，并修改或删除过时的内容。',
  'help.guide.manage-notes.tip.2':
    '编辑时，已附加文件上的红色叉号会在你点击“保存”之前就立即删除该文件，而且不会进入回收站。笔记的每个文件也都会出现在旅行的“文件”标签页中。',
  'help.guide.note-categories.step.6':
    '回到“笔记”卡片，标题下的标签用来筛选卡片。点击某个分类，只看该分类的笔记，点击“全部”或再点一次同一个标签，则显示全部笔记。',
  'help.guide.roadtrip-reorder.tip.1': '在这里移动站点，日程计划中也会同步移动，“天”显示的顺序是一样的。',
  'help.guide.roadtrip-overnight.step.1':
    '在“路线途中”的“查找”下，勾选“住宿”，找营位则勾选“露营地”，选择想停留的日期，然后点击“搜索”。',
  'help.guide.roadtrip-overnight.tip.3':
    '在“驾驶设置”的“路线线条”下开启“每天从住处出发，并在住处结束”后，次日的行车会从你过夜的地方出发。',
  'help.guide.roadtrip-stop-fill.title': '设置一个站点补给到多满',
  'help.guide.roadtrip-bookings.title': '把你的航班、火车或渡轮纳入行车',
  'help.guide.roadtrip-bookings.tip.2':
    '在某个站点预订的餐桌或票券会以标签形式显示在该站点上，不属于任何站点的内容则列在“当天的其他预订”下。',
  'help.guide.roadtrip-google-import.step.3':
    '检查它找到的站点。每个站点都会显示位置，标有“位置未能解析”的站点会被跳过。',
  'help.guide.roadtrip-hazards.step.1': '打开右栏中的“驾驶设置”。',
  'help.ctx.trip-tours.summary':
    '“计划”标签页在游览模式下的右栏：旅行的所有路线集中在一个列表里，就在日期旁边。你可以在这里把路线安排到某一天、筛选列表、在地图上隐藏线条，以及导入 GPX 或 KML 文件。路线的绘制和修改则在“游览”标签页中进行。',
  'help.guide.tour-show-list.goal': '把地点栏换成旅行的路线，这样就能在日期旁边查看并选择它们。',
  'help.guide.tour-show-list.tip.3':
    '“游览”扩展开启时，轨迹不会出现在“地点”列表中，每条导入的轨迹都是一条路线，会列在这里。',
  'help.guide.tour-add-to-day.step.5':
    '如果路线分了阶段，同一个菜单接着会询问。“从这一天起按阶段安排”会把第 1 阶段放在这一天，之后每个阶段依次放在后一天。“整条路线放在这一天”则把整条路线都放在这一天。',
  'help.guide.tour-day-times.step.1': '在日期栏中，指向路线所在的行，点击“更多选项”（三个点），选择“编辑”。',
  'help.guide.tour-day-times.result': '路线会像其他有时间的站点一样出现在当天的时间线中，显示开始和结束时间。',
  'help.guide.tour-remove-from-day.result': '当天不再列出该路线，它在列表中的行上也没有日期徽章了。',
  'help.guide.tour-filter-list.tip.2': '只有路线在某个分区上有差异时，才会显示该分区，所以路线很少时，可能只有“状态”。',
  'help.guide.tour-hide-on-map.tip.1':
    '隐藏只对你自己有效，并保存在此浏览器中对应这个旅行。路线、它的日期和颜色都不会变，其他人的地图上仍会显示这条路线。',
  'help.guide.tour-import-plan-tab.tip.1': '已在旅行中的轨迹会标为“已在行程中”，不会被重复导入。',
  'help.ctx.trip-tour-detail.bullet.4':
    '底部一行：打开某一天时显示“添加到当天”或“从当天移除”，还有通往起点的“导航”、路线的网页、GPX、设备支持分享文件时的“分享”、“收藏”和“复制”。',
  'help.guide.tour-detail-read.step.5':
    '下方是各项测量数据：“距离”“最低海拔”“最高海拔”“累计爬升”和“累计下降”，再往下是时间，以及用路线颜色画出的海拔剖面图。',
  'help.guide.tour-detail-read.result':
    '路线的卡片在计划旁边打开，你可以看到它安排在哪几天、有多长、有多陡，以及来自哪里。',
  'help.guide.tour-rename-colour.tip.2': '铅笔图标和圆点只对有权编辑地点的成员有效。',
  'help.guide.tour-take-along.tip.2':
    '在“设置”中选好常用的地图应用后，点击“导航”会直接打开该应用，而不再列出所有应用。',
  'help.guide.tour-copy-keep.step.3': '想把路线保存下来供其他旅行使用，打开它，点击卡片底部的“收藏”。',
  'help.guide.tour-packing-link.goal':
    '直接在路线卡片里显示出行要带的物品，来源可以是旅行的行李清单，也可以是其中的某个清单。',
  'help.guide.tour-packing-link.tip.3': '关联需要编辑地点的权限。其他人能看到已关联的清单，但不能更改关联。',
  'help.guide.tour-files.tip.2': '只有可以修改路线并添加文件的成员才会看到“上传”。',
  'help.guide.tour-activity-link.step.5': '轨迹现在出现在“实际轨迹”下，带有它自己的数据和剖面图，与计划并排显示。',
  'help.guide.tour-activity-compare.step.2':
    '“距计划最远”显示轨迹与计划线路之间的最大距离，“偏离计划”显示轨迹有多大比例偏离了计划线路。',
  'help.guide.tour-origin-check.step.1':
    '打开路线的卡片，滚动到“来源”。“来源”一栏会写明路线的出处：“GPX 导入”及文件名、KML 或 KMZ 导入，或 wanderer 及其地址。',
  'help.ctx.trip-tour-planner.summary':
    '旅行的路线规划器：左侧是编辑器，右侧是旅行的所有路线，中间是地图。在这里逐点绘制路线，沿真实的小路和道路规划，填写详情，并保存到旅行中。',
  'help.guide.tour-open-workspace.goal': '打开路线规划器，了解它的各个部分分别用来做什么。',
  'help.guide.tour-open-workspace.tip.1':
    '每个侧栏内侧边缘标签页上的“折叠”会把侧栏收起，给地图腾出更多空间，点击“计划”和“本次旅行的游览活动”可让侧栏重新出现。拖动侧栏边缘可调整宽度。',
  'help.guide.tour-draw-route.step.3':
    '确认“路点”下的“添加地点”已开启（它和地图标签里的“放置点”是同一个开关），然后在路线起点处点击地图。',
  'help.guide.tour-draw-route.result': '地图上出现一条带编号的路线，“路点”下是它的各个点，可以直接命名并保存。',
  'help.guide.tour-type-profile.tip.2':
    '有些类型需要填写更多信息才能保存：“跑步”需要“计划配速”，“划桨游”需要船和水域，“滑雪与冬季”路线需要“项目”。',
  'help.guide.tour-edit-points.step.5': '点击旁边的垃圾桶“删除路线点”，即可把这个点从路线中移除。',
  'help.guide.tour-shaping-points.step.2': '把圆点拖到路线应该走的那条小路上，路线会重新规划为经过它。',
  'help.guide.tour-loop-reverse.goal': '让路线回到起点，或把路线方向反过来。',
  'help.guide.tour-leg-by-hand.title': '手动绘制路段，或重新规划它',
  'help.guide.tour-leg-by-hand.result': '该路段按你的选择变成一条直线并标为手动绘制，或者重新做路径规划。',
  'help.guide.tour-trip-places.tip.2': '移除这个站点或取消关联后，地点本身（包括它所在的日期）仍原样留在旅行中。',
  'help.guide.tour-details-times.step.4': '“计划中”显示总用时。输入你自己的数值可以覆盖它，之后它会标为“手动覆盖”。',
  'help.guide.tour-save.step.2': '等“新游览路线”旁边的圆点消失。“保存”需要路线及其所有海拔数据都已算出。',
  'help.guide.tour-edit-saved.goal': '打开你之前规划的路线，修改后再次保存。',
  'help.guide.tour-edit-saved.result': '已保存的路线现在包含了你的更改。',
  'help.guide.tour-summary-profile.tip.2': '经过飞拉达的路线，会在数据上方显示一个带难度等级的警告徽章。',
  'help.guide.tour-list-manage.step.4': '“行程汇总”上方的按钮是筛选，显示当前的状态，起初是“全部”，并带有路线数量。',
  'help.guide.tour-delete.step.1':
    '在“本次旅行的游览活动”下指向该路线，点击它那一行右侧的垃圾桶，提示文字是“删除”加路线名称。',
  'help.guide.tour-saved-elsewhere.step.1':
    '你编辑时，侧栏顶部会出现“这条路线已在别处保存”。在你做出决定之前，你的更改会一直保留。',
  'help.ctx.trip-tour-import.summary':
    '已在别处存在的路线，可以从这里导入旅行：手表或应用里的 GPX、KML 或 KMZ 文件，你另一个旅行里的路线，或你自己 wanderer 里的步道。导入的内容完全保持录制时的样子，你可以据此规划一个可编辑版本。',
  'help.guide.tour-import-gpx.step.1': '打开旅行的“游览”标签页。在右侧“本次旅行的游览活动”顶部，点击 +（“添加行程”）。',
  'help.guide.tour-import-gpx.tip.4':
    'KML 或 KMZ 文件还会在“不导入”下列出除线条之外它还包含的内容：图钉、区域和其他项目。',
  'help.guide.tour-view-import.tip.1':
    '导入的内容不能逐点编辑。点击上方“可编辑版本”卡片中的“规划可编辑版本”，会据此生成一条你可以修改的路线。',
  'help.guide.tour-plan-from-import.step.3':
    '点击“替换导入”，原地重新规划这条路线：它的日期和笔记保留，录制的轨迹也会留着，方便以后恢复。“规划为新游览路线”则不会动导入的内容，而是在旁边另建一条路线。',
  'help.guide.tour-restore-recorded.goal': '撤销对导入内容的重新规划，找回原始轨迹，即使过了很久也可以。',
  'help.guide.tour-take-over.goal': '在你的另一个旅行里复用已经规划或导入过的路线，无需重新绘制。',
  'help.guide.tour-take-over.tip.2': '只会列出你的其他旅行，并且只列出前 100 条路线。其余的请用搜索或筛选查找。',
  'help.guide.tour-import-wanderer.step.4': '点击“导入到旅行”。',
  'help.ctx.trip-tour-map.bullet.1':
    '地图左下角的标签列出已打开路线的类型所提供的底图：“地图”“地形图”、徒步时的“徒步”、骑行时的“骑行”，以及“卫星影像”。你在这里的选择只对规划器生效，不会改变“设置”中的地图设置。',
  'help.guide.tour-map-layers.step.2':
    '点击“地形图”，可以看到等高线和山体阴影，这种地图能看出地面有多陡。你选中的地图在标签中保持高亮。',
  'help.guide.tour-along-search.step.1':
    '在“游览”标签页中打开一条路线，把左侧面板向下滚动到路线站点下方的“沿途”。路线有了线路之后，才会出现这张卡片。',
  'help.guide.tour-along-search.tip.3':
    '结果来自 OpenStreetMap 和 TREK 的地点索引，所以搜索需要联网。什么都没找到时，“扩大到”会尝试下一个距离。服务器繁忙时，“重试”会显示倒计时，倒计时结束后才能再试。',
  'help.guide.tour-along-add-stop.tip.1': '该地点会成为路线的一个站点，而不是旅行的地点，所以不会出现在地点列表中。',
  'help.guide.tour-3d-terrain.step.4': '拖动“地形晕渲”滑块，可以把山丘最多放大到三倍高，在平缓的地形上很有用。',
  'help.guide.tour-3d-flyover.step.1':
    '把路线切换到 3D。沿线地貌加载时，播放按钮的位置会有一个圆环逐渐填满。圆环填满后，点击“播放飞越”。相机会跟随路线上的圆点前进，“游览概览”中海拔剖面图上的光标也会同步移动。',
  'help.guide.tour-map-overlays.title': '在地图上叠加雪道或航标',
  'help.guide.tour-map-overlays.tip.2':
    '没有打开任何路线时，雪道开关也在，所以规划之前就可以先看看滑雪场。徒步时，这个标签改为提供“飞拉达”，并显示视野内的路线数量。',
  'help.ctx.trip-tour-stages.bullet.5':
    '路线行上的加号即“添加到当天”，会从你选的那一天开始，每天放一个阶段，或把整条路线放在那一天。',
  'help.guide.tour-multi-day.step.6':
    '想把它改回一日游，点击“一日游”，并在“改为一日游？”中点击“移除全部阶段终点”确认。路线保持不变。',
  'help.guide.tour-stages-on-days.step.1': '在“本次旅行的游览活动”中，指向多日路线，点击加号，即“添加到当天”。',
  'help.guide.tour-stages-on-days.tip.3':
    '在“计划”标签页中把多日路线拖到某一天上，会在对话框中询问同样的问题，路线卡片中的“添加到当天”也一样。',
  'help.ctx.trip-tour-hike.bullet.4':
    '路点下方的“路径详情”会从 OpenStreetMap 读取每一段的 SAC 等级、路面和道路类型，并据此在地图上给路线着色。其中的任何内容都不会改变路线。',
  'help.guide.tour-hike-plan.step.4':
    '“添加地点”一开始就是开启的：在地图上点击徒步的起点和终点。旁边的“行程地点”则改为选取旅行中的山屋或酒店。有了两个点之后，TREK 就会算出步行路线。',
  'help.guide.tour-hike-trail-details.title': '查看徒步沿途的等级、路面和道路类型',
  'help.guide.tour-hike-trail-details.tip.1':
    'OpenStreetMap 里没有数值的道路会列在“未知”下，未知并不代表好走。如果有些道路显示“本次无法查询”，请点击“重试”。',
  'help.guide.tour-hike-round.step.4':
    '点击一条环线将其选中。它所在的行显示距离、爬升和用时，以及与你所要求距离的差距。',
  'help.guide.tour-hike-compare-ways.step.1':
    '指向这一段开始的站点，点击它那一行的“更多操作”，选择“比较下一段的道路”。',
  'help.guide.tour-ferrata-add.title': '在徒步中加入飞拉达',
  'help.guide.tour-ferrata-add.tip.1': '飞拉达需要装备和经验。徽章的提示文字会说明路线上有多少是飞拉达攀爬。',
  'help.guide.tour-run-plan.step.3': '输入你的“计划配速”，格式为每公里几分几秒，例如 7:30。',
  'help.guide.tour-run-ways.title': '查看跑步路线经过哪些路面',
  'help.ctx.trip-tour-walk.title': '城市漫步',
  'help.guide.tour-walk-plan.goal': '用一个个站点搭建观光漫步路线，设置每个站点停留多久，以及哪些站点最重要。',
  'help.guide.tour-walk-plan.tip.2': '城市漫步没有徒步限制，也没有“休息”字段，改用各站点的停留时间。',
  'help.guide.tour-walk-sights.step.4':
    '点击列表中的一个地点，它的卡片会在地图上方打开。在“插入位置”下，选择它要插入到哪两个站点之间。',
  'help.guide.tour-walk-day-times.step.1':
    '先把漫步安排到某一天：在“本次旅行的游览活动”中，点击它那一行的圆形 +（“添加到当天”），然后选择日期。',
  'help.guide.tour-walk-day-times.result': '你可以调整站点顺序或停留时间，直到你到达时每个地点都在营业。',
  'help.guide.tour-walk-google-import.tip.2':
    '“换一个链接”会回到链接输入框。载入会替换规划器中未保存的更改，对话框会先提醒你。',
  'help.guide.tour-walk-check-off.step.4':
    '列表顶部统计已去过的站点数量，并显示剩余的步行时间。点击站点上的“撤销”可取消它的标记。',
  'help.ctx.trip-tour-bike.bullet.2':
    '右侧的“游览概览”给出“骑行时间（估算）”，这是路径规划器按所选配置并计入爬升算出的时间，不包含休息。',
  'help.guide.tour-bike-profile.step.4':
    '在“路点”下，点击“行程地点”，选取起点和终点，这里先选 Hotel Alpenroyal，再选 Hotel Greif。也可以确认“添加地点”已开启，然后直接点击地图。有了两个点之后，TREK 就会算出路线。',
  'help.guide.tour-bike-profile.tip.5':
    '如果管理员允许使用 CyclOSM 地图，打开骑行路线时，地图上的图层栏还会提供“骑行”。如果它不再加载，请切换回“地图”，路线不会受影响。',
  'help.guide.tour-bike-surfaces.tip.1':
    '“数据中没有”表示 OpenStreetMap 没有记录那里的路面。路面是未知的，并不一定好走。',
  'help.guide.tour-bike-mtb-grades.step.3': '点击某个难度等级所在的行，地图上会高亮显示对应的步道。',
  'help.ctx.trip-tour-ski.bullet.1':
    '“项目”排在最前面，而且没有预选：高山滑雪、单板滑雪、越野滑雪、登山滑雪、雪鞋或冬季徒步。选择“越野滑雪”时还要选“技术”：传统式、自由式或未知。没有选“项目”，路线无法保存。',
  'help.guide.tour-ski-plan.step.2': '打开“路线类型”，选择“滑雪与冬季”。',
  'help.guide.tour-ski-plan.tip.4':
    '没有雪道数据的地方，路段会在两个点之间走直线。对于雪鞋和冬季徒步，路段也可能改走夏季小路，路段上会有灰色提示说明。',
  'help.guide.tour-ski-options.step.5':
    '在“排除”下，点选你不想乘坐的缆车类型：“拖牵”“开放式吊椅”“吊厢”“索道”或“缆索铁路和火车”。被点选的类型会显示删除线。',
  'help.guide.tour-ski-fix-leg.step.2':
    '点击该行提供的修复办法：“允许更难的雪道”“允许这条缆车”“乘缆车下山”“切换技术”或“切换项目”。选项随即改变，路段会重新规划。',
  'help.guide.tour-ski-summary.goal': '查看一天的时间如何分配在滑行、缆车、等待和步行上。',
  'help.guide.tour-ski-summary.result': '你会知道这一天在雪道上、在缆车上以及排队等候各要花多长时间。',
  'help.guide.tour-ski-pistes-layer.tip.3':
    '这个图层是地图数据，不是实时信息：它不说明哪些雪道开放或已压雪，也不说明积雪和雪崩情况。没有打开路线时开关同样存在，所以规划之前就可以先看看滑雪场。',
  'help.guide.tour-ski-import.step.5':
    '在“本次旅行的游览活动”中点击这条轨迹将其打开。之后想更正它的项目，请点击其“滑雪轨迹”卡片中的“更换”。',
  'help.ctx.trip-tour-paddle.bullet.1':
    '在“路线类型”下选择“划桨游”后，需要选择“船”（皮划艇、加拿大式独木舟、SUP 或其他）和“水域”（河流或湖泊）。两项都选好之前，路线无法保存。',
  'help.guide.tour-paddle-setup.step.1': '在“游览”标签页中，点击左栏顶部的“规划新游览路线”。',
  'help.guide.tour-paddle-setup.tip.2': '划桨游的地图提供“地图”和“卫星影像”，还可以叠加来自 OpenSeaMap 的“航标”。',
  'help.guide.tour-paddle-water-route.step.3':
    '选择“沿水路规划下一段”。TREK 会沿河流或湖泊规划从这个点到下一个点的路段。',
  'help.guide.tour-paddle-portage.title': '绕过障碍搬运船只',
  'help.guide.tour-paddle-portage.tip.2':
    '在最后一个点上，“从这里开始陆上搬运”要等你设置了下一个点才会生效。该行会显示“从这里开始搬运”，点它的叉号“不再搬运”即可撤销。',
  'help.guide.tour-paddle-lock.step.4': '输入“等待”和“过闸”的分钟数。两项都填好后，卡片会显示它们的总和。',
  'help.guide.tour-paddle-time.step.2':
    '条带显示从起点到终点的整条路线：水域、棕色的陆上搬运，以及刻度线形式的船闸。路线上的障碍是可以点击的标记，点击后会在地图上定位到它们。',
  'help.guide.tour-paddle-wind.title': '查看划桨当天的风',
  'help.guide.tour-paddle-wind.tip.3': '在有风且需要横渡湖泊的日子，卡片会提供“沿岸规划”，它会沿着湖岸来规划湖泊路段。',
  'help.guide.tour-paddle-checklist.step.4':
    '点击一个条目，地图会移到它的位置：如果是障碍，会打开带有你的决定的卡片，如果是你自己的陆上搬运或船闸，则会选中它的点。',
  'help.guide.tour-paddle-track-marks.title': '在录制的划桨轨迹上标记陆上搬运和船闸',
  'help.guide.tour-paddle-track-marks.step.7': '打开这些卡片，输入各自的分钟数，然后点击“保存”。',
  'help.ctx.trip-tour-horse.bullet.2':
    '路线会在单独的对话框中打开：选择一个路段和骑行的“方向”，查看“马匹通行”，然后点击“采用路段”。',
  'help.guide.tour-horse-plan.step.3':
    '在“骑马路线”卡片中，点击“在地图视图中查找”。视图内每条有路标的马道都会列在那里，并显示长度。',
  'help.guide.tour-horse-plan.tip.3': '搜索后又移动了地图？按钮会变成“搜索此视图”。视图过大时，会提示你先放大。',
  'help.guide.tour-horse-gap.step.4': '在“路点”卡片中，衔接处显示“手动，未经检查”及其长度。把鼠标指向它可以看到原因。',
  'help.guide.tour-horse-recorded.step.2':
    '“导入预览”会打开，此时还没有保存任何内容。在“导入为”下，把“路线类型”设为“骑马游”。三个徽章会说明导入保留了什么，以及哪些内容没有计算。',
  'help.guide.dateless-trip.goal': '还不知道什么时候出发，也可以先开始规划。',
  'help.guide.trip-reminder.step.3': '点击“更新”。',
  'help.guide.upcoming-reservations.goal': '查看你所有旅行中接下来预订了什么，并打开对应的旅行。',
  'help.guide.log-day.tip.3': '标为整天公司假日的日子无法登记。在半天公司假日上，登记一天休假只消耗 0.5 天。',
  'help.guide.half-company-holiday.goal': '给所有人一个自由的下午，例如平安夜，而不用整天都放假。',
  'help.guide.public-holidays.tip.2': '把鼠标悬停在网格中的某个假日上，可以看到它的名称。',
  'help.guide.edit-holiday-calendar.step.3': '在下拉列表中更改国家或地区，或点击垃圾桶移除该日历。',
  'help.guide.person-color.step.2': '选择一种颜色。它会立即保存，对话框随即关闭。',
  'help.guide.answer-fusion-request.goal': '决定是否把你的休假计划与邀请你的人合并。',
  'help.guide.log-for-partner.goal': '为已合并进你计划的人登记休息日，例如对方请你代为登记时。',
  'help.guide.dissolve-fusion.goal': '把合并的计划重新拆成各自独立的计划。',
  'help.guide.country-places.step.1': '搜索一个你去过的国家并选中它，底部的面板里会出现它的卡片。',
  'help.guide.tour-activity-stats.step.3':
    '看一下数据：先是距离，角上标有路线数量，然后是“累计爬升”和“累计下降”。选择“全部类型”时，接着列出你做得最多的三种类型，每种都带有数量和距离。',
  'help.guide.move-to-list.step.1': '点击筛选行中的复选框图标，即“选择”，然后勾选地点。',
  'help.guide.tour-collection-add-to-trip.step.2': '在“添加到的行程”下选择旅行。你无权添加路线的旅行会显示为灰色。',
  'help.guide.tour-collection-manage.goal': '查看列表中保存了哪些路线、它们来自哪里，并清理不再需要的路线。',
  'help.guide.entry-draft.goal': '先写下一个条目，在它准备好之前不在共享的旅程中显示。',
  'help.guide.journey-map-layers.step.2': '点击图层栏末尾的 (i) 查看地图图例，它会解释每种图钉、圆点和线条。',
  'help.guide.journey-keep-route.step.2':
    '核对“这一天的时区”，它决定一天从何时开始、到何时结束，并查看记录情况：距离、时间跨度、片段和空缺。',
  'help.guide.journey-day-stays.step.2':
    '在某条停留记录上点击“写一篇日志”。条目会加到那一天，时间是到达时间，并带上这条停留记录的名称和位置。',
  'help.guide.journey-take-over-day.step.2':
    '勾选要保留的停留记录，并修正它们的名称。在两条已勾选的停留记录之间点击“合并为一个条目”会把它们合并，点击“保持分开”则再次拆开。',
  'help.guide.journey-auto-prepare.step.1': '点击标题栏右上角的 ⋯，打开“旅程设置”。',
  'help.guide.photo-location.step.1': '点击标题栏右上角的 ⋯，打开“旅程设置”。',
  'help.guide.share-public.tip.3': '草稿不会出现在链接中，记录的路线只显示在有已发布条目的日子里。',
  'help.ctx.settings-plugins.title': '插件',
  'help.ctx.settings-about.bullet.2': '“报告错误”和“功能建议”会在 GitHub 上打开项目，Wiki 则通向文档。',
  'help.guide.map-provider.tip.3': '在 GL 地图上，右键拖动可以旋转和倾斜地图，点击鼠标中键可以添加地点。',
  'help.guide.web-push-device.step.1':
    '在“此设备上的推送通知”下，点击“为此设备开启”，浏览器询问时选择允许通知。点击“发送测试”可确认能收到通知。',
  'help.guide.connect-airtrail.title': '连接你的 AirTrail',
  'help.guide.connect-dawarich.title': '连接你的 Dawarich',
  'help.guide.tour-connect-wanderer.title': '连接你的 wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '右侧的“断开连接”会再次移除令牌。',
  'help.guide.tour-wanderer-watch.tip.3':
    '这些提示通过哪些渠道送达，在“通知”中的“wanderer：关于你的路线的提示”这一行设置。',
  'help.guide.plugin-settings.tip.1': '这些设置只属于你自己，其他成员需要自己设置插件。',
  'help.guide.offline-conflicts.step.3':
    '服务器一直拒绝的更改会显示在“离线缓存”的“失败的更改”下：点击“重试”会再发送一次，点击“放弃”则保留服务器的版本。',
  'help.ctx.admin-notifications.bullet.4':
    '底部的“用户默认值”：针对每个事件和渠道，为尚未自行更改的所有人设为“开启”“关闭”或“封锁”。',
  'help.guide.default-user-settings.step.2': '你设置过的字段，名称旁边会出现重置链接，点击即可恢复 TREK 的内置默认值。',
  'help.guide.own-routing-engine.title': '使用你自己的路径规划服务器',
  'help.guide.admin-passkeys.result': '登录页面会出现“使用通行密钥登录”，用户可以在自己的设置中添加通行密钥。',
  'help.guide.rotate-jwt-secret.goal': '怀疑密钥泄露后，让所有会话立即失效。',
  'help.guide.notification-defaults.result':
    '凡是没有改过单元格的用户，都会以你的选择作为起点，被封锁的单元格在他们的设置中显示为已锁定。',
  'help.ctx.notifications.bullet.3':
    '每条通知都会说明谁在哪里做了什么，未读的带有底色。通知下方的按钮，例如“查看旅行”或“查看假期”，会带你过去，同时把它标为已读。',
  'help.guide.read-notifications.tip.1': '铃铛出现在每个带导航栏的页面上，有新通知时数字会自动更新。',
  'help.guide.filter-notifications.tip.1': '向下滚动时，页面会继续加载更早的通知，所以第一屏之后不会被截断。',
  'help.guide.mark-notifications-read.result': '通知不再有底色，铃铛上的红色数字也消失了。',
  'help.guide.notification-settings.title': '选择哪些内容会通知你',
  'help.guide.link-journal.step.1': '点击旅行名称旁的“旅行设置”，在左侧选择“旅程日志”。',
  'help.guide.dawarich-stays.tip.1':
    '在你点击“添加地点”之前，不会有任何内容进入旅行。由停留记录添加的地点，详情中会注明“来自你的 Dawarich 记录”。',
  'help.guide.leave-stop-off-route.title': '让站点不参与路线',
  'help.guide.move-booking-day.step.1': '把鼠标悬停在当天的预订行上，行左侧出现的手柄表示可以拖动。',
  'help.guide.place-image-from-file.tip.1': '只提供 JPG、PNG、GIF 和 WebP 文件，PDF 票据不在其中。',
  'help.guide.place-own-hours.step.4':
    '“营业时间”右侧的按钮：复制按钮会把周一的时间应用到每一天，X 则再次移除你填写的时间。如果 TREK 自己找到了营业时间，点击“从地点详情获取”可以把它们找回来。',
  'help.guide.confirm-stay-booking.step.2': '预订会在计划上方打开。标题栏中的第一个标签显示它的状态。',
  'help.ctx.trip-map.bullet.9':
    '旅行中的每条路线都是一条带自己颜色的线，起点处有一个图钉。点击线条可打开这条路线的卡片。在安排了路线的那一天，当天的路线会通向这条路线的起点，并从它的终点继续。“游览”列表中路线旁边的眼睛图标，即“在地图上隐藏”，可以把它的线条从你的地图上隐藏。',
  'help.guide.tour-map-lines.result': '你想看的路线以各自的颜色显示在地图上，你隐藏的那条则在“游览”列表中显示为暗色。',
  'help.guide.car-stops.step.2':
    '点击标题栏中的类型标签，选择“汽车”。表单随之变化：“日期”和“开始时间”变成“取车”和“取车时间”，“结束日期”和“结束时间”变成“还车”和“还车时间”，“沿途停靠点”出现在“从”和“到”下面。',
  'help.guide.transport-details.goal':
    '在一个地方查看一段行程的全部细节，复制它的预订码，重命名它，或跳转到它在地图上的位置。',
  'help.guide.transport-details.tip.2':
    '按 Esc 键或点击详情外部可关闭详情。如果“重命名”或删除确认正打开着，会先关闭它们。',
  'help.guide.export-transports-csv.tip.1': '只有标签页里至少有一段行程时，工具栏中才有这个图标。',
  'help.guide.group-sort-bookings.step.1': '在“卡片”或“列表”视图中，点击“视图选项”，即三个视图图标后面的滑块图标。',
  'help.guide.create-booking.tip.4':
    '离线时，预订会保存在本设备上，重新联网后自动同步。新文件需要联网，所以请先移除它们，或稍后再保存。如果误点了表单外部，或按了 Esc 键，TREK 会先询问“放弃更改？”，不会直接丢掉你输入的内容。',
  'help.guide.booking-on-map.tip.2': '住宿会定位到它的第一晚。',
  'help.guide.export-bookings-csv.step.3': '点击“导出为电子表格 (CSV)”，即“视图选项”后面的电子表格图标。',
  'help.guide.arrange-packing-list.step.3':
    '“共享”和“我的清单”所在行最右侧的“按名称”，会按名称顺序显示每个清单中的物品，方便你一眼看出某样东西是否已在其中。再点一次可回到你自己的排序。',
  'help.guide.count-packed-pieces.step.1':
    '点击行中的数量徽章，即后面带 x 的小数字，输入要带的数量，例如 5，然后按回车键。',
  'help.guide.expense-receipts.step.3': '点击对话框底部的“保存”。文件会随支出一起上传，同时也会出现在旅行的“文件”中。',
  'help.guide.files-sync-settings.step.1':
    '点击工具栏最右端的“文档同步”。旅行已绑定时，你的文档服务卡片会在右侧打开。有多个文档服务时，点击左侧“当前行程”下你想用的那一个。',
  'help.guide.files-sync-settings.tip.3':
    '“即时更新”（一个链接，旁边是“复制”）只出现在 TREK 无法自动订阅变更的文档服务上。把链接粘贴到文档服务中，变更就会立即送达，而不用等到下一次检查。',
  'help.guide.manage-notes.step.1': '点击笔记卡片标题栏中的三个点（“更多选项”）。菜单里有“展开”“置顶”“编辑”和“删除”。',
  'help.guide.note-categories.title': '把笔记分到不同分类',
  'help.guide.note-categories.result': '笔记会使用新的名称和颜色，“笔记”卡片只显示你选中的分类。',
  'help.guide.roadtrip-stops.tip.5':
    '日程计划中带结束时间的站点会停留到那个时间。它的对话框会说明行车何时离开，点击“移除结束时间”可以重新自己设定时长。',
  'help.guide.roadtrip-reorder.tip.2': '已预订的交通及其枢纽停留在预订决定的位置，只有地点可以拖动。',
  'help.guide.roadtrip-overnight.step.2':
    '酒店显示床形图标，而不是加号。点击它，即“添加为过夜住宿”，会打开用于过夜的“添加为停靠点”。露营地则使用常规的“添加”。',
  'help.guide.roadtrip-stop-fill.goal': '为某一个加油或充电站点单独设置加满程度，例如快充站点 80 %，过夜时 100 %。',
  'help.guide.roadtrip-bookings.goal': '查看已预订的行程在行车中的位置，以及你必须在什么时候赶到那里。',
  'help.guide.roadtrip-bookings.tip.3':
    '不在旅行任何一天的行程不属于行车：侧栏顶部有一条提示会指出它，旁边的“打开预订”可以给它设定日期。',
  'help.guide.roadtrip-google-import.step.4': '在“日期”下选择这些站点所在的日期，然后点击“导入”。',
  'help.guide.roadtrip-hazards.step.2': '在对话框右栏底部的“当前警报”下，打开“显示危险区域”，然后点击“关闭”。',
  'help.ctx.trip-tours.bullet.1':
    '右栏顶部的“地点”和“游览”开关可以把地点列表换成路线。只有“游览”扩展开启时才有这个开关，此时路线不会出现在“地点”列表中。',
  'help.guide.tour-show-list.step.1': '在“计划”标签页中，点击右栏顶部开关里的“游览”。该栏会改为列出路线，而不是地点。',
  'help.guide.tour-show-list.result': '右栏列出旅行中的路线，你点击的那条会在它的卡片中打开。',
  'help.guide.tour-add-to-day.tip.1':
    '把带阶段的路线拖到某一天上，会在一个小对话框中询问同样的问题。点击“取消”则让计划保持原样。',
  'help.guide.tour-day-times.step.2':
    '设置“开始”，“结束”留空。字段下方的一行会说明 TREK 推算出的结束时间：开始时间加上路线的用时。',
  'help.guide.tour-remove-from-day.title': '把路线从某一天移除',
  'help.guide.tour-filter-list.title': '筛选路线列表',
  'help.guide.tour-filter-list.tip.3':
    '如果没有任何结果，列表会显示“没有路线符合这些筛选”，点击“重置筛选”可全部清除。筛选只改变列表显示的内容，不会改动路线或日期。',
  'help.guide.tour-hide-on-map.tip.2':
    '手机上的地图始终显示所有路线，“游览”标签页也没有眼睛图标，隐藏功能只在“计划”标签页的这里可用。',
  'help.guide.tour-import-plan-tab.tip.2':
    '导入的路线会留在这里的列表中，不会在规划器里打开。可以用它那一行的圆形 + 把它安排到某一天，或者打开“游览”标签页在那里查看。',
  'help.ctx.trip-tour-detail.bullet.5':
    '这张卡片用来阅读，以及处理与路线相关的事项。路线本身要在“游览”标签页中修改：打开它，点击“本次旅行的游览活动”下的路线。删除路线也在那里进行，不在这里。',
  'help.guide.tour-detail-read.step.6':
    '继续向下滚动，依次是“描述”和“笔记”，然后是“来源”：在 TREK 中规划、导入时的文件，或来自的 wanderer 路线，并带有日期。',
  'help.guide.tour-rename-colour.title': '重命名路线并更改颜色',
  'help.guide.tour-rename-colour.result': '路线在旅行的各处都显示新名称，线条也用你选的颜色绘制。',
  'help.guide.tour-take-along.tip.3': '文件来自服务器，所以需要联网。离线创建的路线要等同步之后才能下载。',
  'help.guide.tour-copy-keep.step.4': '在“收藏”下选择列表，核对“在收藏中的名称”，然后点击“保存”。',
  'help.guide.tour-packing-link.step.1': '打开路线的卡片，滚动到“行李清单”，点击“关联行李清单”。',
  'help.guide.tour-packing-link.result': '你会来到“列表”标签页中的行李清单，路线的卡片上会实时显示你勾选的每件物品。',
  'help.guide.tour-files.result': '这些文件已与路线关联，可以从它的卡片中打开。',
  'help.guide.tour-activity-link.tip.1': '计划保持不变。轨迹只是被关联上，点击“取消关联”即可再次解除。',
  'help.guide.tour-activity-compare.step.3':
    '点击“在地图上比较”，把实际轨迹以点线画在计划旁边。点击“结束比较”可再次移除。',
  'help.guide.tour-origin-check.step.2':
    '“已导入”显示导入的日期。“此处”显示它现在的状态：“与导入时相同”“已在 TREK 中编辑”，或“已重新规划，记录的轨迹已保留”。',
  'help.ctx.trip-tour-planner.bullet.1':
    '“游览扩展”开启时，“游览”位于旅行标签栏中“计划”之后。电脑和平板上有这个标签页，手机上则可以在“计划”标签页查看路线并安排到某一天，但不能绘制。',
  'help.guide.tour-open-workspace.step.1': '点击旅行标签栏中“计划”之后的“游览”。地图占满屏幕，两侧各有一个侧栏。',
  'help.guide.tour-open-workspace.tip.2': '把 GPX、KML 或 KMZ 文件拖到此标签页的任意位置，即可将它们导入为旅行的路线。',
  'help.guide.tour-draw-route.step.4': '地图底部会出现“已放置点”。旁边的“撤销”可再次取消该点。',
  'help.guide.tour-type-profile.title': '选择路线的类型',
  'help.guide.tour-type-profile.result': '路线会按你选的类型和配置来规划。',
  'help.guide.tour-edit-points.step.6': '侧栏标题中的“撤销路线点编辑”和“重做路线点编辑”可以逐步撤销或重做每一项更改。',
  'help.guide.tour-shaping-points.step.3': '它在“路点”下带有“塑形点”徽章，没有编号，所以站点保持原来的编号。',
  'help.guide.tour-loop-reverse.step.1': '点击“路点”卡片标题栏中的“返回起点”。路线会多出最后一段，回到第一个点。',
  'help.guide.tour-leg-by-hand.goal': '在路径规划器找不到路的地方，用直线连接两个点，或重新规划某一段。',
  'help.guide.tour-trip-places.title': '把旅行中的地点用作站点',
  'help.guide.tour-trip-places.tip.3': '旅行中的其他路线不会作为站点提供。',
  'help.guide.tour-details-times.tip.1': '时间可以输入为 2:56、2 h 56 或 176 minutes。',
  'help.guide.tour-save.step.3': '点击左侧栏底部的“保存”。会出现“游览路线已保存”，侧栏标题变为“编辑游览路线”。',
  'help.guide.tour-edit-saved.step.1':
    '点击“本次旅行的游览活动”下的路线。它会在左侧栏中以“编辑游览路线”的形式打开，地图上显示它的路线。',
  'help.guide.tour-summary-profile.title': '阅读游览概览和海拔剖面图',
  'help.guide.tour-summary-profile.tip.3': '划桨游不显示海拔，因为在水面上，能读到的只有河岸的海拔。',
  'help.guide.tour-list-manage.step.5':
    '选择“未规划”查看还没安排到任何一天的路线，或按“来源”“路线上限”或“类型”缩小范围。每一项都会显示符合条件的路线数量，汇总数据也会随筛选变化。',
  'help.guide.tour-delete.step.2': '看清随之删除的内容：路线、可编辑的路点和日期安排。点击“永久删除”。',
  'help.guide.tour-saved-elsewhere.step.2': '“加载较新版本”会在你确认后，用较新的版本替换你的更改。',
  'help.ctx.trip-tour-import.bullet.1':
    '“本次旅行的游览活动”顶部的 + 是“添加行程”，提供“导入 GPX 或 KML”“从 Google Maps 导入漫步”和“从其他行程引入路线”。文件也可以拖到“游览”标签页的任意位置。',
  'help.guide.tour-import-gpx.step.2':
    '选择“导入 GPX 或 KML”，选取一个或多个 .gpx、.kml 或 .kmz 文件，每个最大 10 MB。',
  'help.guide.tour-import-gpx.tip.5':
    '没有海拔数据的文件会提示“文件中没有海拔”。线路和距离仍然正确，但累计爬升和累计下降无法得知。',
  'help.guide.tour-view-import.tip.2': '标题栏中的下载图标可以把它再次保存为 GPX 文件，书签图标则把它保存到收藏中。',
  'help.guide.tour-plan-from-import.step.4': '路线连同路点会在编辑器中打开。需要的话可以修改，然后点击栏底部的“保存”。',
  'help.guide.tour-restore-recorded.step.1':
    '在“本次旅行的游览活动”中，点击你重新规划过的路线。编辑器里的“录制的轨迹”卡片会说明，它录制时的轨迹仍然保留着。',
  'help.guide.tour-take-over.step.1':
    '打开路线要放入的那个旅行的“游览”标签页。在“本次旅行的游览活动”顶部，点击 +（“添加行程”）。',
  'help.guide.tour-take-over.tip.3':
    '“引入路线需要网络连接。”如果编辑器里有未保存的更改，副本仍会加入列表，但不会打开，这样你正在做的工作不会被覆盖。',
  'help.guide.tour-import-wanderer.tip.1':
    '在“设置”的“集成”中连接了 wanderer 后，才会有这个按钮。在此之前，列表里显示“在设置中连接”。',
  'help.ctx.trip-tour-map.bullet.2':
    '标签中分隔线之后是与路线类型对应的开关：编辑路线时的“放置点”、徒步时的“飞拉达”、划桨游时的“航标”，以及滑雪路线时的雪道。末尾的 3D 会把路线显示在 3D 地貌上。',
  'help.guide.tour-map-layers.step.3':
    '徒步时，点击“徒步”可看到有标记的步道及其编号。骑行路线则改为提供“骑行”，显示自行车路线。“卫星影像”提供航拍影像，“地图”则回到标准地图。',
  'help.guide.tour-along-search.step.2':
    '点击“要找什么”，勾选你想要的类型，一次最多六种：“观景点”“山顶”“小屋与避难所”“饮用水”“餐饮”等。列表会提供适合路线类型的选项，路线默认勾选其中三种。',
  'help.guide.tour-along-add-stop.title': '把路线沿途的地点添加为站点',
  'help.guide.tour-along-add-stop.tip.2':
    '如果某个地点会成为新的终点，会标有“作为新终点”和“会延长路线”：原来的终点不再是终点，路线会延伸到这个地点。',
  'help.guide.tour-3d-terrain.step.5': '再次点击 3D，回到平面地图，继续规划。',
  'help.guide.tour-3d-flyover.step.2': '在“速度”下选择 1×、2× 或 4×。1× 时，大多数路线从头到尾大约需要 45 秒。',
  'help.guide.tour-map-overlays.goal': '规划滑雪或划桨路线时，在地图上叠加滑雪道和缆车，或浮标和港口标志。',
  'help.guide.tour-map-overlays.tip.3':
    '某个图层停止加载时，它的开关会显示 ! 和说明。没有这个图层，地图和你的路线仍可正常使用。',
  'help.guide.tour-multi-day.title': '规划跨越多天的路线',
  'help.guide.tour-multi-day.tip.1':
    '“在此结束阶段”对一日游同样有效，路线会自动变成多日路线。第一个和最后一个站点，以及塑形点，都不能作为阶段终点。',
  'help.guide.tour-stages-on-days.step.2': '选择第一个阶段出发的日期。',
  'help.guide.tour-stages-on-days.tip.4':
    '在日程计划中，每个阶段显示为“阶段 N”，并带有各自的距离和时间。“计划”标签页中日期上方的“撤销”可以一步撤回整个分配。',
  'help.ctx.trip-tour-hike.bullet.5':
    '徒步时，左下角地图按钮行中的“飞拉达”会在地图上显示附近的飞拉达。点击飞拉达的卡片，可以把它作为单独的一段加入路线。',
  'help.guide.tour-hike-plan.step.5':
    '在“详情”下，打开“步道最高难度”，选择步道允许的难度，从 T1（徒步）到 T6（高难度高山徒步）。路线会在此范围内重新规划。',
  'help.guide.tour-hike-trail-details.goal':
    '查看 OpenStreetMap 为徒步路线所经道路记录的信息，并在地图上找到这些路段。',
  'help.guide.tour-hike-trail-details.tip.2': '超过徒步上限的等级，所在行会带有“超出上限”徽章。',
  'help.guide.tour-hike-round.step.5': '点击“选用此环线”，在询问是否替换已规划的路线时，点击“替换”。',
  'help.guide.tour-hike-compare-ways.step.2':
    '“这一段的其他道路”会在地图上方打开，列出“当前道路”和“道路 A”“道路 B”等。每条道路都用各自的颜色画在地图上，把鼠标指向某一行会高亮它的线条。',
  'help.guide.tour-ferrata-add.goal': '找到徒步路线周围的飞拉达，并让其中一条成为路线的一部分。',
  'help.guide.tour-ferrata-add.tip.2':
    '飞拉达只在徒步中提供。路线已经攀爬的飞拉达，卡片上显示“行程的一部分”，而不是“加入行程”。',
  'help.guide.tour-run-plan.step.4':
    '在地图上设置起点和终点，也可以用“行程地点”选取。配速下方会显示跑步用时：距离乘以配速。',
  'help.guide.tour-run-ways.goal': '查看跑步路线中有多少是未铺装路面，以及小路有多难走。',
  'help.ctx.trip-tour-walk.summary':
    '在“游览”标签页中规划的逐站步行路线：每个站点停留多久、哪些站点重要、沿途的景点，以及漫步当天何时到达每个站点，并对照营业时间检查。',
  'help.guide.tour-walk-plan.step.1': '点击左栏顶部的“规划新游览路线”，然后打开“路线类型”，选择“城市漫步 / 观光”。',
  'help.guide.tour-walk-plan.tip.3':
    '站点“更多操作”中的“解除与地点的关联”只会撤销与旅行地点的关联，地点本身仍留在旅行中。',
  'help.guide.tour-walk-sights.step.5': '点击“添加为停靠点”。会出现一条提示，说明漫步增加了多少时间，旁边是“撤销”。',
  'help.guide.tour-walk-day-times.step.2':
    '给它设置当天的开始时间：在“计划”标签页中，右键点击当天的这条漫步，选择“编辑”，填写“开始”。',
  'help.guide.tour-walk-google-import.title': '把 Google Maps 步行路线变成城市漫步',
  'help.guide.tour-walk-google-import.tip.3':
    '只会引入站点，不包括 Google Maps 中画出的线条。maps.app.goo.gl 这类短链接需要联网才能展开。',
  'help.guide.tour-walk-check-off.tip.1': '标记是按天保存的，请从计划中的那一天打开漫步，而不是从路线列表打开。',
  'help.ctx.trip-tour-bike.bullet.3':
    '“路点”下方的“路面与道路”卡片显示路线经过的地面情况：路面、道路类型，以及已知为未铺装路面的占比。点击一行，可以在地图上高亮对应路段。',
  'help.guide.tour-bike-profile.step.5':
    '查看右侧“游览概览”中的“骑行时间（估算）”。把鼠标停在它的信息圆点上，可以看到它的计算方式。',
  'help.guide.tour-bike-surfaces.title': '查看骑行路线经过什么路面',
  'help.guide.tour-bike-surfaces.tip.2':
    '在“公路”配置下，条形图上方的警告会说明已知有多长是未铺装路面。点击“在地图上显示”可标出这些路段。',
  'help.guide.tour-bike-mtb-grades.result': '地图会标出你所选等级的步道，你就知道路线中哪些路段比较难走。',
  'help.ctx.trip-tour-ski.bullet.2':
    '“项目”下方是雪道路径规划器的选项，只显示你所选项目用到的：“最难的雪道”“优先”“节奏”、“乘坐缆车”等开关，以及用来选择不想乘坐的缆车类型的“排除”。每次更改都会重新规划路线。',
  'help.guide.tour-ski-plan.step.3':
    '在“项目”下，选择你要做的活动：高山滑雪、单板滑雪、越野滑雪、登山滑雪、雪鞋或冬季徒步。没有预选项，不选就无法保存路线。',
  'help.guide.tour-ski-plan.result':
    '“本次旅行的游览活动”中多了一条已保存的“滑雪与冬季”路线，各路段沿着地图上标注的雪道、缆车和步道，用时在“游览概览”中算出。',
  'help.guide.tour-ski-options.tip.1': '每次更改都会逐段重新规划路线。',
  'help.guide.tour-ski-fix-leg.step.3': '如果没有合适的修复办法，点击“画直线”，该路段会变成两个点之间的直线。',
  'help.guide.tour-ski-summary.step.1': '在路点下方找到“雪道路线”卡片。点击它的标题可折叠，再点一次展开。',
  'help.guide.tour-ski-pistes-layer.title': '在地图上显示雪道',
  'help.guide.tour-ski-pistes-layer.result': '雪道会画在路线下方，你可以看懂它们的颜色。',
  'help.guide.tour-ski-import.step.6': '在“为滑雪轨迹分类”中，选择正确的项目或技术，然后点击“保存”。',
  'help.ctx.trip-tour-paddle.bullet.2':
    '每个点都以徽章显示它的角色：“下水点”“上岸点”“重新下水点”或“终点上岸点”。点的下方显示其后的内容：手动绘制的路段、陆上搬运、船闸，或某一段无法规划的原因。',
  'help.guide.tour-paddle-setup.step.2': '打开“路线类型”，选择“划桨游”，即“水上，皮划艇、独木舟或桨板”。',
  'help.guide.tour-paddle-setup.tip.3': '划桨游的“沿途”会优先查找“下水点”“租船”和“饮用水”。',
  'help.guide.tour-paddle-water-route.step.4':
    'TREK 无法规划的路段会变红并说明原因，例如该区域还没有水域数据。点击“画直线”可以先手动画出它。',
  'help.guide.tour-paddle-portage.goal': '标记你需要搬运船只的一段，让它按陆地计算，并计入上岸和重新下水的时间。',
  'help.guide.tour-paddle-portage.tip.3': '在你于“用时估算”卡片中设置自己的“搬运速度”之前，搬运按 2 km/h 计算。',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK 不知道船闸的运行时间表。时间只是你输入的数值，所以请自己核实船闸的开放时间。',
  'help.guide.tour-paddle-time.step.3':
    '“水上”一行是按你的“划桨速度”算出的水上距离。要改速度，请在栏顶部的“划桨速度”字段中修改。',
  'help.guide.tour-paddle-wind.goal': '查看你划桨当天路线起点的风速预报。',
  'help.guide.tour-paddle-wind.tip.4': '没有预报数值不代表安全。请在现场确认实际情况。',
  'help.guide.tour-paddle-checklist.step.5': '在栏底部，点击“划桨有风险”，出发前先阅读“水上安全”。',
  'help.guide.tour-paddle-track-marks.goal': '从手表导入划桨轨迹，并标出你搬运船只和过闸的位置。',
  'help.guide.tour-paddle-track-marks.tip.1': '请直接点在轨迹线上：离线条太远的点击会被拒绝，卡片会说明。',
  'help.ctx.trip-tour-horse.bullet.3':
    '每个路段在“路点”卡片中是一个徽章，带有路线名称、通行状态圆点和长度。没有马道覆盖的路段显示为“手动，未经检查”。',
  'help.guide.tour-horse-plan.step.4': '点击列表中的一条路线。它会在自己的地图上打开，路段带有编号。',
  'help.guide.tour-horse-plan.tip.4': '左栏标题栏中的“撤销路线点编辑”可以一步撤回整个路段。',
  'help.guide.tour-horse-gap.result': '骑行路线不再有缺口，衔接的路段会标为手动绘制。',
  'help.guide.tour-horse-recorded.step.3': '点击“导入 1 条路线”。',
  'help.guide.dissolve-fusion.step.3': '在弹出的窗口中点击“解除”确认。',
};

export default help;
