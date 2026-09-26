import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': '帮助与文档',
  'help.search': '搜索文档…',
  'help.contents': '目录',
  'help.noResults': '没有匹配的页面。',
  'help.errorTitle': '无法加载此页面',
  'help.errorBody': '帮助内容来自 TREK wiki，请检查连接后重试。',

  // center
  'help.center.button': '此页面的帮助',
  'help.center.title': '帮助',
  'help.center.onThisScreen': '关于此页面',
  'help.center.screens': '页面',
  'help.center.thisScreen': '当前页面',
  'help.center.subScreens': '子页面：{count}',
  'help.center.subScreensLabel': '子页面',
  'help.center.guidesCount': '{count} 篇指南',
  'help.center.goToScreen': '前往{screen}',
  'help.center.overview': '概览',
  'help.center.howTo': '如何操作',
  'help.center.searchPlaceholder': '搜索指南和文档…',
  'help.center.searchEmpty': '未找到与“{query}”相关的内容。',
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
  'help.center.result': '结果',
  'help.center.tips': '小贴士',
  'help.center.related': '相关内容',
  'help.center.openDocs': '在“帮助与文档”中打开',
  'help.center.docsSection': '文档',
  'help.center.noContext': '此页面暂无指南。',
  'help.center.noContextHint': '搜索文档，或告诉我们您在找什么。',
  'help.center.feedback': '缺了什么？',
  'help.center.feedbackLink': '在 GitHub 上告诉我们',
  'help.center.discord': '在 Discord 提问',
  'help.center.quick': '快速',
  'help.center.guide': '指南',
  'help.center.tour': '操作演示',
  'help.center.imageAlt': '“{title}”第 {n} 步',

  // ctx
  'help.ctx.dashboard.title': '仪表盘',
  'help.ctx.dashboard.summary':
    '仪表盘是所有旅行的入口。顶部的登机牌突出显示正在进行或即将开始的旅行，下方一行统计你已走过的旅程，卡片则列出你正在计划、已归档或已完成的全部旅行。',
  'help.ctx.dashboard.bullet.1': '登机牌：正在进行或下一趟旅行，含日期、同行者、地点和倒计时。点击即可打开旅行。',
  'help.ctx.dashboard.bullet.2': '旅行统计：去过的国家、旅行次数、在途天数和飞行距离，汇总你的全部旅行。',
  'help.ctx.dashboard.bullet.3':
    '旅行卡片：按“已计划”“已归档”“已完成”筛选，以网格或列表显示。将鼠标悬停在卡片上可编辑、复制、归档和删除。',
  'help.ctx.dashboard.bullet.4': '右侧组件：货币换算、世界时钟、即将到来的预订和收藏集。每一个都可以关闭。',
  'help.ctx.dashboard.bullet.5': '“新建旅行”卡片和右下角的按钮都可以新建旅行。',

  // create-trip
  'help.guide.create-trip.title': '新建旅行',
  'help.guide.create-trip.goal': '用名称、日期和封面图片开始一趟新旅行。',
  'help.guide.create-trip.step.1': '点击“新建旅行”。旅行列表末尾的卡片和右下角的按钮作用相同。',
  'help.guide.create-trip.step.2': '给旅行起个名字。这是唯一的必填项，其余内容都可以稍后添加。',
  'help.guide.create-trip.step.3': '选择开始和结束日期。TREK 会为每个日期创建一天，行程随即可以开始填写。',
  'help.guide.create-trip.step.4': '可选：添加封面图片。上传自己的照片、拖入一张，或在 Unsplash 搜索目的地。',
  'help.guide.create-trip.step.5': '点击“创建新旅行”。',
  'help.guide.create-trip.result': '旅行会出现在仪表盘上。如果它是你的下一趟旅行，会显示在顶部的登机牌中。',
  'help.guide.create-trip.tip.1': '日期以后可以修改。如果已有预订，TREK 会询问是否连同日程一起移动。',
  'help.guide.create-trip.tip.2': '此处选择的旅行货币是所有费用的换算目标。请选择目的地的货币。',

  // edit-trip
  'help.guide.edit-trip.title': '编辑旅行',
  'help.guide.edit-trip.goal': '重命名旅行、更改日期或调整设置。',
  'help.guide.edit-trip.step.1': '将鼠标悬停在旅行卡片（或登机牌）上，点击铅笔图标。',
  'help.guide.edit-trip.step.2': '按需修改：名称、描述、日期、封面、货币、提醒或成员。',
  'help.guide.edit-trip.step.3': '点击“更新”。',
  'help.guide.edit-trip.result': '卡片会立即更新，旅行的每位成员都能看到。',
  'help.guide.edit-trip.tip.1': '移动已有预订的旅行日期时，会出现第二步，询问预订是否一并移动。',

  // cover-image
  'help.guide.cover-image.title': '设置封面图片',
  'help.guide.cover-image.goal': '为旅行设置一张在卡片和登机牌上显示的图片。',
  'help.guide.cover-image.step.1': '通过卡片上的铅笔图标打开旅行的编辑表单。',
  'help.guide.cover-image.step.2': '在“封面图片”处拖入照片、点击上传，或在 Unsplash 搜索框输入目的地。',
  'help.guide.cover-image.step.3': '选择一张照片，点击“更新”。',
  'help.guide.cover-image.result': '照片随旅行一起保存，并在所有列出该旅行的地方显示。',
  'help.guide.cover-image.tip.1': '来自 Unsplash 搜索的照片会自动标注来源；你自己上传的照片保存在你的服务器上。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '复制旅行',
  'help.guide.duplicate-trip.goal': '把一趟旅行当作模板，复用到新旅行。',
  'help.guide.duplicate-trip.step.1': '将鼠标悬停在卡片上，点击复制图标。',
  'help.guide.duplicate-trip.step.2': '查看哪些内容会被复制、哪些不会，然后确认。',
  'help.guide.duplicate-trip.result': '副本会出现在原旅行旁边，改个名字和日期即可使用。',
  'help.guide.duplicate-trip.tip.1':
    '日程、地点、预订、预算项、打包清单和每日备注会被复制。成员、聊天、投票、文件和分享链接不会。',

  // archive-trip
  'help.guide.archive-trip.title': '归档与恢复旅行',
  'help.guide.archive-trip.goal': '不删除旅行，只是先收起来，以后再恢复。',
  'help.guide.archive-trip.step.1': '将鼠标悬停在卡片上，点击“归档”。',
  'help.guide.archive-trip.step.2': '把卡片上方的筛选切换为“已归档”即可再次看到它。',
  'help.guide.archive-trip.step.3': '点击卡片上的“恢复”，它就回到“已计划”。',
  'help.guide.archive-trip.result': '归档的旅行保留全部内容，只是不再占据仪表盘和全部旅行的日历订阅。',

  // delete-trip
  'help.guide.delete-trip.title': '删除旅行',
  'help.guide.delete-trip.goal': '彻底删除一趟旅行。',
  'help.guide.delete-trip.step.1': '将鼠标悬停在卡片上，点击垃圾桶图标。',
  'help.guide.delete-trip.step.2': '确认。对话框会显示旅行名称，方便你核对。',
  'help.guide.delete-trip.result': '旅行及其日程、地点、预订和文件都会被删除，且无法撤销。拿不准的话请改为归档。',

  // filter-and-view
  'help.guide.filter-and-view.title': '查找已完成的旅行，切换网格与列表',
  'help.guide.filter-and-view.goal': '查看已完成或已归档的旅行，并选择喜欢的布局。',
  'help.guide.filter-and-view.step.1': '使用卡片上方的“已计划”“已归档”“已完成”。结束日期已过的旅行都属于“已完成”。',
  'help.guide.filter-and-view.step.2': '点击列表图标切换为紧凑列表，再点一次回到网格。',
  'help.guide.filter-and-view.result': '仪表盘会记住你在此设备上的布局。',

  // calendar-feed
  'help.guide.calendar-feed.title': '在日历中订阅全部旅行',
  'help.guide.calendar-feed.goal': '在你的日历应用中查看每趟进行中旅行的日程和预订，并保持同步。',
  'help.guide.calendar-feed.step.1': '点击视图切换旁边的日历图标。',
  'help.guide.calendar-feed.step.2': '点击“Enable calendar subscription”。TREK 会生成一个私密的订阅链接。',
  'help.guide.calendar-feed.step.3':
    '用按钮（Google、Apple、Outlook）添加订阅，或把链接复制到任何支持 URL 订阅的日历应用。',
  'help.guide.calendar-feed.result':
    '每趟进行中的旅行都会显示在你的日历里并自动更新。已归档的旅行和结束超过 90 天的旅行不包含在内。',
  'help.guide.calendar-feed.tip.1': '链接是私密的，任何拿到链接的人都能读取订阅；一旦泄露，请在同一对话框中撤销。',

  // widgets
  'help.guide.widgets.title': '选择仪表盘组件',
  'help.guide.widgets.goal': '显示或隐藏统计行和右侧组件。',
  'help.guide.widgets.step.1': '打开右上角的头像菜单，选择“设置”。',
  'help.guide.widgets.step.2': '切换到“外观”标签页。',
  'help.guide.widgets.step.3': '在“仪表盘组件”下开启或关闭各个组件。桌面端和移动端分别设置。',
  'help.guide.widgets.step.4': '回到仪表盘，更改立即生效。',
  'help.guide.widgets.result': '隐藏的组件会把空间让给旅行；关闭整个右栏后，布局会居中显示。',
  'help.guide.widgets.link': '打开外观设置',

  // currency-widget
  'help.guide.currency-widget.title': '货币换算',
  'help.guide.currency-widget.goal': '按当前汇率在两种货币之间换算金额。',
  'help.guide.currency-widget.step.1': '输入金额并选择两种货币。',
  'help.guide.currency-widget.step.2': '中间的箭头交换货币对，圆形箭头刷新汇率。',
  'help.guide.currency-widget.result': '货币对会保存在你的账户中，在每台设备上都一致。',
  'help.guide.currency-widget.tip.1': '汇率来自欧洲中央银行，每天更新一次。',

  // timezones-widget
  'help.guide.timezones-widget.title': '添加世界时钟',
  'help.guide.timezones-widget.goal': '随时掌握目的地的当地时间。',
  'help.guide.timezones-widget.step.1': '点击“时区”组件中的 +，搜索一个城市。',
  'help.guide.timezones-widget.step.2': '点击时钟旁边的 × 即可移除。',
  'help.guide.timezones-widget.result': '时钟会随你的账户一起保存。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay 是你的个人休假计划器：一年有多少假期、已记录了哪些、还剩多少。网格一览整年；侧栏包含年份选择、共同规划的人、与你共享的日历、图例和你的假期额度。',
  'help.ctx.vacay.bullet.1': '年度网格：十二张月卡片，每天一格。点击某天即可记录或清除。小蓝点标记已有旅行覆盖的日子。',
  'help.ctx.vacay.bullet.2': '底部工具栏：“休假”或“公司假日”模式，以及改变点击记录内容的“半天”和“调休”开关。',
  'help.ctx.vacay.bullet.3': '“年假额度”：本年天数、已用和剩余，含上一周期结转。',
  'help.ctx.vacay.bullet.4': '“成员”是与你的计划合并的人，各有自己的颜色。“共享日历”以只读圆环显示他人的休假日。',
  'help.ctx.vacay.bullet.5': '“设置”涵盖周末、每周起始日、结转、你的休假年度、公司假日以及公共假日或学校假期日历。',
  // log-day
  'help.guide.log-day.title': '记录一个休假日',
  'help.guide.log-day.goal': '在年度网格中标记一天休假，并看到余额随之变化。',
  'help.guide.log-day.step.1': '看底部工具栏：带你颜色的左侧按钮表示点击会为你记录一个休假日。',
  'help.guide.log-day.step.2': '在任意月卡片中点击某天。它会填上你的颜色，“已用”增加一天。',
  'help.guide.log-day.step.3': '再次点击同一天即可清除。',
  'help.guide.log-day.result': '该日已记录，“天”“已用”“剩余”立即更新，与你合并计划的人都能实时看到。',
  'help.guide.log-day.tip.1': '“设置”中“锁定周末”开启时，周末无法记录。',
  'help.guide.log-day.tip.2': '格子中的蓝点表示你的某次旅行覆盖了那天，这样能看到休假与旅行的重合之处。',
  // half-day
  'help.guide.half-day.title': '记录半天',
  'help.guide.half-day.goal': '只休一个下午，而不花掉一整天额度。',
  'help.guide.half-day.step.1': '在工具栏打开“半天”。橙色圆点就是半天在网格中的标记。',
  'help.guide.half-day.step.2': '点击某天。它记录为 0.5，角落带有橙色圆点。',
  'help.guide.half-day.step.3': '完成后关闭“半天”；用不同设置点击半天会就地转换。',
  'help.guide.half-day.result': '“已用”增加 0.5。“半天”和“调休”相互独立，因此也可以记录半天调休。',
  'help.guide.half-day.tip.1': '工具栏始终显示下一次点击将放置的标记，记录前可先确认。',
  // comp-day
  'help.guide.comp-day.title': '记录调休或弹性时间',
  'help.guide.comp-day.goal': '使用不消耗假期额度的补休。',
  'help.guide.comp-day.step.1': '在工具栏打开“调休”。斜线圆盘就是调休日在网格中的样子。',
  'help.guide.comp-day.step.2': '点击某天。它以你颜色的斜线填充，而不是实色块。',
  'help.guide.comp-day.result': '调休日在额度磁贴旁单独统计，永不减少“剩余”。',
  'help.guide.comp-day.tip.1': '补回的加班、弹性工时、补休日：凡是休息但不算休假的都属于这里。',
  // entitlement
  'help.guide.entitlement.title': '设置假期额度',
  'help.guide.entitlement.goal': '告诉 Vacay 你一年有多少休假天数。',
  'help.guide.entitlement.step.1': '在侧栏“年假额度”下点击“天”磁贴。',
  'help.guide.entitlement.step.2': '输入天数并按回车。',
  'help.guide.entitlement.result': '“剩余”由额度、结转（如有）和已用天数重新计算。',
  'help.guide.entitlement.tip.1': '每年各有额度，此处更改只影响所选年份。',
  // years
  'help.guide.years.title': '添加和切换年份',
  'help.guide.years.goal': '提前规划明年，或回顾去年。',
  'help.guide.years.step.1': '点击年份右侧的 + 添加下一年，或左侧的 + 添加上一年。',
  'help.guide.years.step.2': '用箭头或下方的年份标签切换年份。',
  'help.guide.years.step.3': '要删除年份，将鼠标悬停在其标签上并点击小减号。该年的记录会一并删除，请谨慎确认。',
  'help.guide.years.result': '每年保留各自的额度和记录；结转把它们连接起来。',
  // company-holidays
  'help.guide.company-holidays.title': '标记公司假日',
  'help.guide.company-holidays.goal': '屏蔽全公司休息的日子，不消耗任何人的额度。',
  'help.guide.company-holidays.step.1': '打开“设置”，确认“公司假日”已开启。默认开启；只有开启时工具栏才提供该模式。',
  'help.guide.company-holidays.step.2': '回到网格，把工具栏切换到“公司假日”模式。',
  'help.guide.company-holidays.step.3': '点击相应日期。它们变为琥珀色并出现在图例中。',
  'help.guide.company-holidays.result': '公司假日对所有合并计划的人可见，且永不减少“剩余”。',
  'help.guide.company-holidays.tip.1': '任何已合并的成员都能编辑公司假日，请约定由谁维护。',
  // public-holidays
  'help.guide.public-holidays.title': '显示公共假日',
  'help.guide.public-holidays.goal': '把你所在国家或地区的公共假日放到网格上。',
  'help.guide.public-holidays.step.1': '打开“设置”并开启“公共假日”。',
  'help.guide.public-holidays.step.2': '点击“添加日历”，选择国家，必要时再选地区。可选设置颜色和标签。',
  'help.guide.public-holidays.step.3': '关闭“设置”。假日出现在网格和图例中。',
  'help.guide.public-holidays.result': '公共假日以日历颜色标记，永不计入你的额度。',
  'help.guide.public-holidays.tip.1': '可以添加多个日历，例如你自己的地区和已合并同事的地区。',
  // school-holidays
  'help.guide.school-holidays.title': '显示学校假期',
  'help.guide.school-holidays.goal': '把所在地区的学校假期与自己的休假并排查看。',
  'help.guide.school-holidays.step.1': '打开“设置”并开启“School Holidays”。',
  'help.guide.school-holidays.step.2': '点击“添加日历”并选择国家。若该国按地区划分，请再选地区或分组。',
  'help.guide.school-holidays.step.3': '关闭“设置”。每段假期在其日期底部显示彩色条带。',
  'help.guide.school-holidays.result': '学校假期仅作显示，不会减少任何人的额度。',
  'help.guide.school-holidays.tip.1': '缺少地区？管理员可在“管理”、“个性化”、“学校假期”中手动维护。',
  // weekends
  'help.guide.weekends.title': '锁定周末并设置每周起始日',
  'help.guide.weekends.goal': '把周末排除在统计之外，并从你习惯的那天开始一周。',
  'help.guide.weekends.step.1': '打开“设置”。',
  'help.guide.weekends.step.2': '开启“锁定周末”，并选择哪些天算作你的周末。',
  'help.guide.weekends.step.3': '在“每周开始于”选择周一或周日。',
  'help.guide.weekends.result': '被屏蔽的日子在网格中显示为灰色，无法误记。',
  // leave-year
  'help.guide.leave-year.title': '设置休假年度',
  'help.guide.leave-year.goal': '按财年或入职日期计算额度，而不是一月到十二月。',
  'help.guide.leave-year.step.1': '打开“设置”并找到“休假年度”。',
  'help.guide.leave-year.step.2': '选择“日历年”、“财年”（指定起始月日）或“入职日”（指定入职日期）。',
  'help.guide.leave-year.result': '额度、已用天数和结转都按该周期计算，网格从其第一个月开始。',
  'help.guide.leave-year.tip.1': '此设置是个人的：在合并计划中，每个人保留自己的休假年度和数字。',
  // carry-over
  'help.guide.carry-over.title': '结转未用天数',
  'help.guide.carry-over.goal': '把周期末剩余的天数加到下一周期。',
  'help.guide.carry-over.step.1': '打开“设置”。',
  'help.guide.carry-over.step.2': '开启“结转”。',
  'help.guide.carry-over.result': '结转数量会在所有年份重新计算，并显示在额度下方。',
  'help.guide.carry-over.tip.1': '关闭后所有结转余额归零。',
  // invite
  'help.guide.invite.title': '与他人共同规划',
  'help.guide.invite.goal': '与另一位 TREK 用户合并计划，在同一网格中看到彼此的休假。',
  'help.guide.invite.step.1': '点击“成员”面板中的人形图标。',
  'help.guide.invite.step.2': '选择用户并发送邀请。',
  'help.guide.invite.step.3': '对方收到通知并接受。在此之前邀请显示为待处理。',
  'help.guide.invite.result': '两个计划合并：每人一种颜色，可以互相记录休假，一切实时同步。',
  'help.guide.invite.tip.1': '要撤销合并，请使用“设置”中的“解除合并”。每个人的记录会回到自己的计划。',
  'help.guide.invite.tip.2': '如果对方只需查看你的休假，请共享日历而不是合并。',
  // share-calendar
  'help.guide.share-calendar.title': '以只读方式共享日历',
  'help.guide.share-calendar.goal': '让别人看到你何时休假，而不给他们修改你计划的权限。',
  'help.guide.share-calendar.step.1': '点击“共享日历”面板中的共享图标。',
  'help.guide.share-calendar.step.2': '选择用户并点击“共享”。无需对方接受。',
  'help.guide.share-calendar.step.3': '与你共享的日历出现在同一面板；眼睛图标可隐藏，“停止共享”撤销你的共享。',
  'help.guide.share-calendar.result': '你的休假以彩色圆环显示在对方网格中。你共享的内容对方无法编辑。',
  'help.guide.share-calendar.tip.1': '共享与合并相互独立：可以与一人合并，同时与其他人共享。',
  'help.guide.share-calendar.tip.2': '悬停在带圆环的日子上，即可查看谁休假以及休多久。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas 是你在世界地图上的旅行足迹：每个旅行带你去过的国家都会被上色，在用 TREK 之前去过的国家可以手动添加。放大可以看到地区，把还想去的地方记在心愿单里，并在底部的玻璃面板中查看你的数字。',
  'help.ctx.atlas.bullet.1':
    '地图：已访问的国家带有专属且不变的颜色，计划中的国家是虚线轮廓，心愿单里的国家是斜线填充，其余都是灰色。将鼠标悬停在国家上可查看它的旅行、地点以及首次和最近一次到访。',
  'help.ctx.atlas.bullet.2':
    '顶部搜索：输入国家或地点。选一个国家，地图会飞过去并打开它的弹窗；选一个地点，会落在它所在的地区，方便你标记那里。',
  'help.ctx.atlas.bullet.3':
    '右上角的“显示计划中的国家”：显示你即将出发的旅行所涉及的国家。这个开关只在你有这类旅行时才出现。',
  'help.ctx.atlas.bullet.4':
    '底部面板：“统计”标签页有国家、旅行、地点、城市、天数、大洲和你的连续记录；“心愿单”标签页列出还在前方等你的地方。',
  'help.ctx.atlas.bullet.5': '地区：从缩放级别 5 起，地图切换为州和省，每一个都可点击来标记或取消标记。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：连接该扩展后，统计左侧会出现一个面板，根据你的记录勾掉心愿并添加国家，但绝不会不经你确认就执行。',
  // mark-country
  'help.guide.mark-country.title': '将国家标记为已访问',
  'help.guide.mark-country.goal': '添加一个你在用 TREK 之前去过的国家，让地图和计数把它算进去。',
  'help.guide.mark-country.step.1': '在地图顶部的搜索框中输入国家名。',
  'help.guide.mark-country.step.2': '从列表中选择它。地图飞过去，并为该国打开一个弹窗。',
  'help.guide.mark-country.step.3': '选择“标记为已访问”。',
  'help.guide.mark-country.result':
    '该国在地图上获得自己的颜色，“国家”计数加一。这个颜色是永久的：再标记其他国家也不会打乱其余国家的颜色。',
  'help.guide.mark-country.tip.1': '在地图上点击灰色国家会打开同一个弹窗；对小国来说，搜索是最可靠的入口。',
  'help.guide.mark-country.tip.2': '手动标记的国家始终算作已访问，不管去那里的旅行日期如何。',
  // unmark-country
  'help.guide.unmark-country.title': '移除你标记过的国家',
  'help.guide.unmark-country.goal': '把手动标记的国家再从地图上拿掉。',
  'help.guide.unmark-country.step.1': '搜索该国并选择它，或在地图上点击它。对于你自己标记的国家，弹窗会问是否移除。',
  'help.guide.unmark-country.step.2': '点击“移除”确认。',
  'help.guide.unmark-country.result': '该国变回灰色，并从你的计数中消失。',
  'help.guide.unmark-country.tip.1':
    '只有手动标记的国家才能这样移除。有旅行或地点的国家会一直保留，直到这些旅行或地点不在为止；如果国家是手动标记的，面板里它的详情卡片上也有“移除”。',
  // country-details
  'help.guide.country-details.title': '查看你在某个国家做过什么',
  'help.guide.country-details.goal': '打开一个已访问的国家，跳转到带你去那里的旅行。',
  'help.guide.country-details.step.1': '搜索一个你访问过的国家。',
  'help.guide.country-details.step.2':
    '选择它。地图飞过去，底部面板会多出一张卡片，带有国旗、地点、旅行以及每次旅行一个标签。',
  'help.guide.country-details.result': '点击旅行标签即可在规划器中打开那次旅行。',
  'help.guide.country-details.tip.1': '在地图上悬停该国会显示同样的数字，外加首次和最近一次到访。',
  // planned-countries
  'help.guide.planned-countries.title': '显示你即将前往的国家',
  'help.guide.planned-countries.goal': '把即将出发的旅行所涉及的国家放到地图上，但不把它们算作已访问。',
  'help.guide.planned-countries.step.1': '打开右上角的“显示计划中的国家”。旁边的数字是有多少个国家在等你。',
  'help.guide.planned-countries.step.2': '搜索一个计划中的国家并选择它：面板会显示“计划中”，地图提示会显示你何时出发。',
  'help.guide.planned-countries.result':
    '计划中的国家以虚线轮廓显示，所以永远不会看起来像你已经去过的地方。开关会记住你的选择。',
  'help.guide.planned-countries.tip.1':
    '去某国的旅行一旦开始，该国就算作已访问；进行中的旅行也算。没有日期的旅行完全不进入统计。',
  'help.guide.planned-countries.tip.2': '这个开关只在你有即将出发的旅行时才存在。',
  // regions
  'help.guide.regions.title': '标记地区',
  'help.guide.regions.goal': '比国家更细：标记你去过的州、省或县。',
  'help.guide.regions.step.1': '放大一个国家，直到它的地区出现，从缩放级别 5 起。搜索并选择该国就能飞到足够近的位置。',
  'help.guide.regions.step.2': '点击一个地区。悬停会显示它的名称；弹窗显示该地区及其所属国家。',
  'help.guide.regions.step.3': '选择“标记为已访问”。',
  'help.guide.regions.result': '该地区填上其国家的颜色。标记地区时，如果该国尚未算作已访问，也会一并算上。',
  'help.guide.regions.tip.1': '点击已访问的地区会提供“移除”，无论是你标记的，还是某个地点让它变成已访问的。',
  'help.guide.regions.tip.2': '你有真实地点的地区会自动标记；那里无需操作。',
  // search-place
  'help.guide.search-place.title': '查找地点并标记它所在的地区',
  'help.guide.search-place.goal': '通过搜索米兰来标记伦巴第，无需知道某座城市属于哪个地区。',
  'help.guide.search-place.step.1':
    '在搜索框中输入城市、地标或地址。国家排在最前；匹配的地点显示在它们下方的“地点”标题下。',
  'help.guide.search-place.step.2': '选择该地点。地图飞过去，并判断这个点位于哪个地区。',
  'help.guide.search-place.step.3': '为该地区选择“标记为已访问”，或者如果它还在你的前方，选择“添加到心愿单”。',
  'help.guide.search-place.result':
    '该地区被标记，它所属的国家也一并标记。地图数据包中没有地区数据的国家会退回到国家本身。',
  'help.guide.search-place.tip.1': '地点来自与 TREK 其他地方相同的搜索，因此遵循管理员设置的提供商。',
  // bucket-country
  'help.guide.bucket-country.title': '把国家放进心愿单',
  'help.guide.bucket-country.goal': '直接在地图上维护一份想去国家的心愿单，与你去过的国家分开。',
  'help.guide.bucket-country.step.1': '搜索该国并选择它，或在地图上点击它。',
  'help.guide.bucket-country.step.2': '选择“添加到心愿单”。',
  'help.guide.bucket-country.step.3': '如果已经知道时间，就选一个月份和年份，然后点击“添加到心愿单”确认。',
  'help.guide.bucket-country.result':
    '该国以斜线填充绘制，颜色就是你到达后它将拥有的颜色，并出现在面板的“心愿单”标签页中。',
  'help.guide.bucket-country.tip.1': '国家进入心愿单后，同一个弹窗会提供“从心愿单移除”。',
  'help.guide.bucket-country.tip.2':
    '每个目标日期一条：同一个国家可以以两个不同的月份出现在心愿单中，但同一个月不能出现两次。',
  // bucket-place
  'help.guide.bucket-place.title': '把地点添加到心愿单',
  'help.guide.bucket-place.goal': '保存你梦想中的城市、景点或地址，带有坐标和目标日期。',
  'help.guide.bucket-place.step.1': '在底部面板中打开“心愿单”标签页。',
  'help.guide.bucket-place.step.2': '点击“添加地点”。',
  'help.guide.bucket-place.step.3': '输入名称并按搜索按钮；选择匹配项，让该地点带上坐标。只输入名称、跳过搜索也可以。',
  'help.guide.bucket-place.step.4': '如果愿意，选一个月份和年份，然后点击“添加”。',
  'help.guide.bucket-place.result': '该地点带着目标日期出现在心愿单顶部；旁边的 × 可以把它再移除。',
  'help.guide.bucket-place.tip.1': '带坐标的心愿，就是日后当你的记录显示你到过那里时，Dawarich 可以替你勾掉的那种。',
  // stats
  'help.guide.stats.title': '读懂你的统计',
  'help.guide.stats.goal': '了解面板中的数字统计什么，不统计什么。',
  'help.guide.stats.step.1':
    '“国家”是你真正去过的不同国家的数量；计划中的国家显示在旁边，不计入其中。“旅行”“地点”和“天”是所有旅行的总计。“城市”由地点的地址推算而来，所以是估算值。',
  'help.guide.stats.step.2':
    '各大洲显示每个大洲已访问的国家数；去过南极洲后，它会加入这一行。然后是你的连续记录，即至少有一次旅行的连续年数，以及你今年的旅行次数。',
  'help.guide.stats.result': '数字会随着你规划旅行而自动更新；这里没有任何需要维护的地方。',
  'help.guide.stats.tip.1':
    '城市是从地址文本中读出来的，不做查询，所以像“Osteria Francescana, Italy”这样的短地址，或以县级行政区结尾的地址，可能得到一个地区而不是城市。',
  'help.guide.stats.tip.2': '手动标记的国家会计入“国家”和各大洲，但不会带来旅行、地点或天数。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '从你的记录里添加国家',
  'help.guide.dawarich-countries.goal': '让 Dawarich 说出你去年都在哪些国家待过，并把你确认的那些放到地图上。',
  'help.guide.dawarich-countries.step.1':
    '连接 Dawarich 扩展后，地图底部、统计左侧会有一个 Dawarich 面板，带两块磁贴。点击“国家”。',
  'help.guide.dawarich-countries.step.2':
    '对话框在它的“国家”标签页上打开。点击“查找国家”：TREK 逐月读取你的记录在最近 12 个月里覆盖的国家和城市，所以请稍等片刻。你的 Atlas 还没有的每个国家都会列出，带着国旗、城市数量和其中第一个城市的名字，并且一开始就已勾选；点击一行可以把它排除。',
  'help.guide.dawarich-countries.step.3':
    '用右下角的按钮确认，勾选了五行时它写着“添加 5 个国家”。对话框会说添加了多少个；关掉它，地图已经自己重新读取过了。',
  'help.guide.dawarich-countries.result':
    '确认过的国家在地图上带上颜色，并计入“国家”，记录为来自 Dawarich。你手动标记的内容不受影响。',
  'help.guide.dawarich-countries.tip.1':
    'Atlas 已经显示为已访问的国家，不论是手动标记、来自某次旅行还是来自更早的一次核对，都会被排除，所以你自己的标记永远不会被重新标注。你之前从 Atlas 里移除的国家，在这里确认后会回来。',
  'help.guide.dawarich-countries.tip.2':
    'TREK 匹配不上的国家名会列在各行下方，而不是被丢掉，“再查一次”会再问 Dawarich 一遍。列表下方的备注说明查看的是最近 12 个月；这个范围是固定的。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '从你的记录里勾掉心愿',
  'help.guide.dawarich-wishes.goal': '找出你的心愿单上实际已经到过的地方，并按实际到达的那一天把它们勾掉。',
  'help.guide.dawarich-wishes.step.1': '在地图底部、统计左侧的 Dawarich 面板里，点击“心愿单”。',
  'help.guide.dawarich-wishes.step.2':
    '对话框在它的“心愿单”标签页上打开。点击“核对愿望清单”：TREK 会在你的记录里查找每一条带坐标的条目。你到过的心愿会列出，带着你靠得多近、待了多久和那一天，并且一开始就已勾选；已经勾掉的会写着“已勾掉”。列表下方有一条备注统计没有坐标的条目，规则也写在那里：“在 250 米以内停留 20 分钟以上，才算实现心愿。”',
  'help.guide.dawarich-wishes.step.3':
    '用右下角的按钮确认，勾选了两行时它写着“勾掉 2 项”。然后关掉对话框，打开旁边面板的“心愿单”标签页。',
  'help.guide.dawarich-wishes.result':
    '每个心愿都带一个绿色对勾，日期是停留的那一天，而不是今天；它的提示写着“依据你的 Dawarich 记录勾掉”，点击日期可以撤销。',
  'help.guide.dawarich-wishes.tip.1':
    '路过不算：规则同时需要距离和时间，几次都符合的停留里，最长的那次胜出。没有坐标的心愿无法核对，所以请通过“添加地点”里的搜索来添加地点，而不是只凭名字。',
  'help.guide.dawarich-wishes.tip.2':
    '一次核对最多查看 50 条，先看还没勾掉的，条目更多时会说明。已经勾掉的心愿保留它自己的日期。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '收藏',
  'help.ctx.collections.summary':
    'Collections 是你在任何行程之外的地点库：把你找到并想留住的地点整理成带名字的列表，每个地点都有“想法”“想去”或“已去过”之一的状态。地点只会被复制进出行程，从不关联，所以列表和行程永远不会互相改变。',
  'help.ctx.collections.bullet.1':
    '左侧的列表栏：你自己的列表、共享给你的列表、等待你接受的邀请、把你拥有的一切合在一起的“全部已保存”，以及顶部的“新建列表”和文件导入。',
  'help.ctx.collections.bullet.2':
    '打开列表的标题区：它的颜色、封面、描述和链接，成员，以及右侧的“编辑”“导出”“共享”操作。',
  'help.ctx.collections.bullet.3':
    '地点上方的筛选行：状态、类别、评分和排序，标签筛选，用于添加地点的 +，行程导入，以及用于批量操作的“选择”。',
  'help.ctx.collections.bullet.4': '地点行：头像、名称和地址、标签和类别，以及右侧一键循环切换的状态胶囊。',
  'help.ctx.collections.bullet.5':
    '右侧的地图：每个有坐标的地点一枚图钉，列表与地图切换，搜索框和标签筛选。点击图钉会打开该地点。',
  'help.ctx.collections.bullet.6':
    '详情面板：点击一行可查看封面、类别、标签、状态、描述和链接，并有“编辑”“复制到行程”和“从列表中移除”。',
  // create-list
  'help.guide.create-list.title': '创建列表',
  'help.guide.create-list.goal': '新建一个带名字的列表，配上颜色和封面，准备装入地点。',
  'help.guide.create-list.step.1': '点击列表栏顶部的“新建列表”。',
  'help.guide.create-list.step.2': '给列表起名并选一个颜色。封面图、描述和链接是可选的，之后可以通过“编辑”添加。',
  'help.guide.create-list.step.3': '点击“创建”。',
  'help.guide.create-list.result': '列表以空状态打开，“添加地点”和“从行程导入”是填充它的两种方式。',
  'help.guide.create-list.tip.1': '封面可以是你自己上传的图片，也可以是在同一对话框里通过 Unsplash 搜索找到的照片。',
  // add-place
  'help.guide.add-place.title': '添加地点',
  'help.guide.add-place.goal': '找到一个地点，把名称、类别、状态和备注一次性保存到打开的列表。',
  'help.guide.add-place.step.1': '点击地点上方筛选行里的 +。',
  'help.guide.add-place.step.2': '在搜索框输入地点并选一个结果。名称、地址和坐标会据此填入。',
  'help.guide.add-place.step.3':
    '设置状态，如果需要再加上类别、描述和链接，然后点击“添加”。对话框会为下一个地点保持打开；“取消”会关闭它。',
  'help.guide.add-place.result': '地点出现在列表中；如果有坐标，也会作为图钉出现在地图上。',
  'help.guide.add-place.tip.1':
    '在行程内部，地点检查器或地点菜单里的“保存到收藏”可以把行程中的地点放进列表，无需离开行程。',
  'help.guide.add-place.tip.2':
    '列表必须是你自己的，或者你在其中是编辑者或管理员；“全部已保存”和你只能查看的列表上没有 +。',
  // import-from-trip
  'help.guide.import-from-trip.title': '从行程导入地点',
  'help.guide.import-from-trip.goal': '把整个行程的地点一次性搬到列表上，而不是逐个保存。',
  'help.guide.import-from-trip.step.1': '点击筛选行里带云朵箭头的导入按钮。在空列表上，同样的操作位于“添加地点”旁边。',
  'help.guide.import-from-trip.step.2': '选一个你的行程。',
  'help.guide.import-from-trip.step.3':
    '勾选你想要的地点。已经在列表里的地点会变灰；行程中没有任何一天包含的地点一开始就是选中的。“仅新增”会隐藏你已经拥有的。',
  'help.guide.import-from-trip.step.4': '点击“导入”。按钮上总会写明即将添加多少个。',
  'help.guide.import-from-trip.result': '地点连同名称、地址、坐标、描述和类别被复制到列表上。行程保持原样。',
  'help.guide.import-from-trip.tip.1': '名称或坐标相同的重复项会被自动跳过，所以导入两次也没有坏处。',
  'help.guide.import-from-trip.tip.2': '在行程的地点列表内部，选择模式则提供“保存到收藏”，用于你亲手挑选的一组地点。',
  // place-status
  'help.guide.place-status.title': '设置地点的状态',
  'help.guide.place-status.goal': '记录哪些是想法，哪些在候选名单上，以及你去过哪里。',
  'help.guide.place-status.step.1': '点击地点行右端的状态胶囊。“想法”变为“想去”。',
  'help.guide.place-status.step.2': '再点一次变为“已去过”，再点一次回到“想法”。',
  'help.guide.place-status.result': '胶囊及其颜色立即改变；列表上方状态筛选的计数也会跟着变。',
  'help.guide.place-status.tip.1': '状态是 Collections 自己的东西：把地点复制到行程不会把它带过去。',
  'help.guide.place-status.tip.2':
    '在行程中，“保存到收藏”会为该地点所在的每个列表显示一个状态胶囊，地点面板里则有针对所选地点的“标记为已去过”操作。',
  // place-detail
  'help.guide.place-detail.title': '打开已保存的地点',
  'help.guide.place-detail.goal': '查看一个地点的全部信息并进行操作：编辑、复制到行程、移除。',
  'help.guide.place-detail.step.1': '点击一个地点行。详情面板在列表旁边打开，地图平移到该地点。',
  'help.guide.place-detail.step.2':
    '底部是“编辑”“复制到行程”和“从列表中移除”；封面上的相机可以把自动获取的照片换成你自己的。',
  'help.guide.place-detail.result': '“编辑”会让名称、类别、标签、地址、坐标、描述和链接直接在面板里变为可编辑。',
  'help.guide.place-detail.tip.1':
    '当地点没有自己的图片时，封面会自动获取。你自己上传的图片可以是 JPG、PNG、GIF 或 WebP，最大 20 MB。',
  'help.guide.place-detail.tip.2': '共享列表的成员也可以在这里留下星级评分，筛选行里的评分筛选使用的是平均值。',
  // labels
  'help.guide.labels.title': '用标签给地点分组',
  'help.guide.labels.goal': '在共用的类别之外，给列表加上它自己的标签，比如街区或天数。',
  'help.guide.labels.step.1': '从筛选行里的标签控件打开标签管理器。',
  'help.guide.labels.step.2': '输入名称，选一个颜色，点击“添加标签”。在同一对话框里可以重命名、改色或删除已有标签。',
  'help.guide.labels.step.3':
    '开启“选择”，勾选地点，点击选择栏里的“分配标签”。单个地点也可以通过其详情面板上的“编辑”获得标签。',
  'help.guide.labels.step.4': '在筛选行里选一个或多个标签，把列表和地图收窄到带有其中任一标签的地点。',
  'help.guide.labels.result': '带标签的地点会在行上显示它们的标签；标签筛选对每个成员可用，包括查看者。',
  'help.guide.labels.tip.1': '标签只属于创建它的那一个列表。把地点移动到另一个列表会丢掉它们。',
  'help.guide.labels.tip.2': '管理和分配标签需要对列表的编辑权限。',
  // filter-select
  'help.guide.filter-select.title': '筛选和选择地点',
  'help.guide.filter-select.goal': '收窄列表，并一次对许多地点进行操作。',
  'help.guide.filter-select.step.1':
    '使用筛选行里的下拉菜单：状态、类别、最低评分和排序顺序。每一个都会显示它会留下多少地点。',
  'help.guide.filter-select.step.2': '点击“选择”。每一行都会出现一个复选框，并出现一个选择栏。',
  'help.guide.filter-select.step.3':
    '勾选地点，或用“全选”选中当前筛选出的全部，然后选择“分配标签”“移动到列表”“复制到列表”“复制到行程”或“删除”。',
  'help.guide.filter-select.result': '操作会一次应用到整个选择。右侧的 × 退出选择模式。',
  'help.guide.filter-select.tip.1': '“全选”跟随筛选，所以筛选到“想去”再全选，是处理候选名单的快捷方式。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '把地点复制到行程',
  'help.guide.copy-to-trip.goal': '把已保存的地点变成你某个行程里的站点。',
  'help.guide.copy-to-trip.step.1': '开启“选择”并勾选地点，或打开一个地点并使用其详情面板上的“复制到行程”。',
  'help.guide.copy-to-trip.step.2': '点击选择栏里的“复制到行程”。',
  'help.guide.copy-to-trip.step.3': '选择行程。搜索框可以收窄长列表。',
  'help.guide.copy-to-trip.result':
    '地点连同名称、描述、类别、备注、价格、坐标、照片和标签进入该行程的地点列表。收藏中没有任何改变。',
  'help.guide.copy-to-trip.tip.1': '共享列表的查看者也可以这样做；这是从列表中复制出去，不会改变列表。',
  // share-list
  'help.guide.share-list.title': '与他人共享列表',
  'help.guide.share-list.goal': '和这个 TREK 上的其他人一起实时规划一个列表。',
  'help.guide.share-list.step.1': '点击你列表标题区里的“共享”。',
  'help.guide.share-list.step.2': '选择用户和一个角色：“查看者”“编辑者”或“管理员”。',
  'help.guide.share-list.step.3': '点击“发送邀请”。在对方在自己的列表栏里接受邀请之前，此人显示为“待处理邀请”。',
  'help.guide.share-list.result':
    '接受后，列表会出现在对方的“已共享”下，每一次改动都实时同步。成员及其角色在同一对话框里随时可改。',
  'help.guide.share-list.tip.1':
    '查看者可以查看、评分并把地点复制到自己的行程。编辑者可以添加和编辑地点与标签。管理员还可以删除。',
  'help.guide.share-list.tip.2': '只有所有者能邀请和移除他人；成员可以自己退出共享列表。',
  // export-list
  'help.guide.export-list.title': '把列表导出为文件',
  'help.guide.export-list.goal': '把列表交给另一个 TREK 上的人，或带进地图应用。',
  'help.guide.export-list.step.1': '点击列表标题区里的“导出”。',
  'help.guide.export-list.step.2':
    '选“TREK 列表”用于另一个 TREK，含标签和状态；或选 GPX 用于 OsmAnd、Organic Maps、Garmin 设备以及其他能读取航点的应用。',
  'help.guide.export-list.result': '文件开始下载。共享列表的任何成员都可以导出它。',
  'help.guide.export-list.tip.1': '没有坐标的地点无法成为 GPX 航点；它会被略去，TREK 会告诉你略去了多少个。',
  'help.guide.export-list.tip.2': '评分、成员和上传的照片是有意不带走的；它们属于这个 TREK，不属于列表。',
  // import-file
  'help.guide.import-file.title': '从文件导入列表',
  'help.guide.import-file.goal': '导入一个 TREK 列表文件或 GPX 文件，作为新列表或放进你已有的列表。',
  'help.guide.import-file.step.1': '点击列表栏里“新建列表”旁边带上传箭头的导入按钮。',
  'help.guide.import-file.step.2': '选择文件。在任何事情发生之前，TREK 会先显示里面有什么：名称、多少个地点和标签。',
  'help.guide.import-file.step.3':
    '保留“新建列表”并按需改名，或选“添加到列表”把地点放进一个你能编辑的列表，然后点击“导入”。',
  'help.guide.import-file.result':
    '你会来到带有已导入地点的列表。添加到列表只会添加；已经在那里的地点保留它们的状态、备注和标签。',
  'help.guide.import-file.tip.1':
    '从 GPX 导入时，每个有名字的航点都会成为一个地点；轨迹是线条，会被略去，预览会说明那是多少个点。',
  'help.guide.import-file.tip.2':
    '既不是 TREK 列表也不是 GPX 的文件会被拒绝并给出原因；某一个无法读取的地点只会被跳过，而不是整个文件。',
  // edit-list
  'help.guide.edit-list.title': '编辑或删除列表',
  'help.guide.edit-list.goal': '更改列表的名称、颜色、封面、描述或链接，或移除该列表。',
  'help.guide.edit-list.step.1': '点击列表标题区里的“编辑”。只有所有者能看到它。',
  'help.guide.edit-list.step.2': '改你想改的，然后点击“保存”。左下角的“删除列表”会在确认后连同全部地点一起移除该列表。',
  'help.guide.edit-list.result': '标题区立即换上新的颜色、封面和描述。',
  'help.guide.edit-list.tip.1': '删除列表无法撤销。如果想保留副本，请先导出。',
  // all-saved
  'help.guide.all-saved.title': '搜索你的整个地点库',
  'help.guide.all-saved.goal': '一次看遍你拥有的每一个列表。',
  'help.guide.all-saved.step.1': '点击列表栏里的“全部已保存”。它把你拥有或共同拥有的每个列表的地点合在一起。',
  'help.guide.all-saved.step.2': '像在任何列表上一样使用搜索框和筛选；“选择”在这里也可用，用于复制到行程。',
  'help.guide.all-saved.result': '一个视图看遍你所有已保存的地点，没有添加和导入，因为没有一个确定的列表可以放入它们。',
  'help.guide.all-saved.tip.1': '标签是按列表的，所以“全部已保存”上不提供标签筛选。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '旅程',
  'help.ctx.journey.summary':
    '旅程是你以照片为主的旅行日记。每段旅程都关联一次或多次旅行，并由带有故事、照片、心情和天气的条目一天天生长起来。这个页面列出你的旅程；打开一段就可以开始写。',
  'help.ctx.journey.bullet.1':
    '顶部的横幅显示进行中的旅程，或者你最近的一段，连同它的条目、照片和地点数量。“继续写作”会在今天这一页打开它。',
  'help.ctx.journey.bullet.2': '下方每段旅程一张卡片，带有封面、副标题、日期和各项数量。点击卡片即可打开。',
  'help.ctx.journey.bullet.3': '网格中的最后一张卡片“创建新旅程”，会从你的旅行开始一段新旅程。',
  // create-journey
  'help.guide.create-journey.title': '创建旅程',
  'help.guide.create-journey.goal': '为一次旅行开始一本日记，旅行的地点已经作为建议等在那里。',
  'help.guide.create-journey.step.1': '点击网格中的最后一张卡片“创建新旅程”。',
  'help.guide.create-journey.step.2':
    '给它起个名字，愿意的话再加一个副标题，然后勾选它所属的旅行。计数器会告诉你有多少地点会被带进来。',
  'help.guide.create-journey.step.3': '点击“创建旅程”。',
  'help.guide.create-journey.result':
    '日记打开。已关联旅行的每个地点都以建议的形式出现在时间线上，它所在的每一天各一条，随时可以写进去。',
  'help.guide.create-journey.tip.1': '之后可以在“旅程设置”里关联更多旅行。',
  'help.guide.create-journey.tip.2': '没有旅行的旅程也可以；这时你就手动添加条目。',
  // open-journey
  'help.guide.open-journey.title': '打开旅程',
  'help.guide.open-journey.goal': '进入一本日记，并知道它会在哪里打开。',
  'help.guide.open-journey.step.1': '点击一张卡片。每张卡片都显示封面、日期，以及这段旅程有多少条目、照片和地点。',
  'help.guide.open-journey.result':
    '进行中的旅程在今天这一页打开；如果还什么都没写，则在今天之前的最后一条打开；已结束的旅程从开头打开。',
  'help.guide.open-journey.tip.1': '除非你在“旅程设置”里另外设定，封面就是旅程的第一张照片。',
  // continue-writing
  'help.guide.continue-writing.title': '继续进行中的旅程',
  'help.guide.continue-writing.goal': '直接跳到你正在经历的旅程的今天这一页。',
  'help.guide.continue-writing.step.1': '点击顶部横幅里的“继续写作”。横幅显示进行中的旅程，没有的话则显示最近的一段。',
  'help.guide.continue-writing.result': '日记在今天这一页打开；如果还什么都没写，则在今天之前的最后一条打开。',
  'help.guide.continue-writing.tip.1': '横幅还会为尚未建立旅程的旅行给出建议；“忽略”会隐藏那条建议。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '日记',
  'help.ctx.journey-detail.summary':
    '一段打开的旅程：左侧是逐日排列的时间线，右侧是地图，带有每个条目和已关联旅行的地点。所有往日记里添加内容的入口都在顶部；页眉包含各项数量、“Studio”、建议开关和“旅程设置”。',
  'help.ctx.journey-detail.bullet.1':
    '页眉：封面、标题和副标题，天数、地点、条目和照片数量，右侧是“Studio”、建议开关和“旅程设置”。',
  'help.ctx.journey-detail.bullet.2': '工具栏：“时间线”和“图库”标签页、“在这段旅程中搜索”，以及“添加条目”。',
  'help.ctx.journey-detail.bullet.3':
    '时间线：每天一个区块，带一个 + 用来在那天添加条目；条目卡片带有照片、心情、天气和故事；来自旅行的建议以较浅的样式显示，并带有“忽略这条建议”。',
  'help.ctx.journey-detail.bullet.4':
    '地图：条目显示为图钉，按日期顺序用虚线连接，还有旅行的地点，以及导入到这些旅行中的任何 GPX 轨迹。',
  'help.ctx.journey-detail.bullet.5':
    '“旅程设置”：封面、名称和副标题、地图上的轨迹、记录字段、已忽略的建议、已关联的旅行、贡献者、公开分享、归档和删除。',
  'help.ctx.journey-detail.bullet.6': '两个圆形按钮悬浮在较长的时间线上：回到顶部，以及跳到最后一条。',
  // add-entry
  'help.guide.add-entry.title': '写一条条目',
  'help.guide.add-entry.goal': '添加一天的故事，带上标题、正文、心情和天气。',
  'help.guide.add-entry.step.1': '点击工具栏里的“添加条目”，或者点击某一天页眉上的 +，从那天开始。',
  'help.guide.add-entry.step.2':
    '给这个瞬间起个名字，写下故事。文本上方的工具栏可以用 Markdown 添加粗体、斜体、标题、引用、链接和列表。',
  'help.guide.add-entry.step.3':
    '选一个心情和天气，核对日期，愿意的话再钉上一个位置：搜索一个地点，或者使用你的当前位置。',
  'help.guide.add-entry.step.4': '点击“保存”。',
  'help.guide.add-entry.result': '条目出现在时间线上它所属的那天，并在地图上显示为一枚图钉。页眉里的数量随之更新。',
  'help.guide.add-entry.tip.1': '在建议里写作用的是同一个编辑器，只是地点已经设好。',
  'help.guide.add-entry.tip.2': '底部的标签是自由文本，比如“hidden gem”或“best meal”，搜索也能找到它们。',
  // entry-photos
  'help.guide.entry-photos.title': '给条目添加照片和视频',
  'help.guide.entry-photos.goal': '把图片放到某一天；第一张会成为条目的封面。',
  'help.guide.entry-photos.step.1': '用卡片上的 ⋯ 打开条目菜单，选择“编辑”。',
  'help.guide.entry-photos.step.2':
    '点击“上传照片”并选择文件。“从相册”取用旅程图库里已有的图片；“External photos”在已连接的 Immich 或 Synology 图库里搜索那一天的照片。',
  'help.guide.entry-photos.step.3': '把鼠标悬停在一张图片上，用“设为第1张”选定封面，然后点击“保存”。',
  'help.guide.entry-photos.result': '照片显示在卡片上和图库里；第一张在所有地方都作为缩略图。',
  'help.guide.entry-photos.tip.1': '视频以同样的方式加到条目上：mp4、m4v、webm 或 mov，最大 500 MB，按上传原样存储。',
  'help.guide.entry-photos.tip.2': '来自 iPhone 的 HEIC 文件会在上传时转换为 JPEG，这会丢掉其中的 GPS 和相机元数据。',
  // suggestions
  'help.guide.suggestions.title': '使用或忽略建议',
  'help.guide.suggestions.goal': '把旅行中的地点变成条目，并清掉那些你不打算写的。',
  'help.guide.suggestions.step.1': '建议是一张较浅的卡片，地点名称为斜体。点击它会打开编辑器，地点和日期已经设好。',
  'help.guide.suggestions.step.2':
    '在不会用到的卡片上点击“忽略这条建议”。它会离开时间线但不会被删除，旅行同步也不会再次提供它。',
  'help.guide.suggestions.step.3': '改变主意了？“旅程设置”会显示有多少条已被忽略，“找回已忽略的建议”会把它们全部找回。',
  'help.guide.suggestions.result': '时间线上只留下你打算写的内容；阅读时，页眉的开关可以一次隐藏所有建议。',
  'help.guide.suggestions.tip.1': '跨越两天的地点会在每一天各给出一条建议。',
  'help.guide.suggestions.tip.2': '建议从不计入统计；只有已写的条目才算。',
  // add-on-day
  'help.guide.add-on-day.title': '在更早的一天添加条目',
  'help.guide.add-on-day.goal': '写一个已经过去的日子，不用事后再改日期。',
  'help.guide.add-on-day.step.1': '点击那一天页眉上的 +。',
  'help.guide.add-on-day.step.2': '编辑器打开，日期已经设好。像往常一样写好并“保存”。',
  'help.guide.add-on-day.result': '条目直接落在正确的那一天。',
  'help.guide.add-on-day.tip.1': '在同一天内，条目菜单里的箭头可以把它往前或往后移。',
  // pros-cons
  'help.guide.pros-cons.title': '添加评价',
  'help.guide.pros-cons.goal': '用哪些很棒、哪些不怎么样来总结一天。',
  'help.guide.pros-cons.step.1':
    '在编辑器里，故事下方找到“优缺点”。在“优点”或“缺点”里输入一条，用“再添加一个”写下一条。',
  'help.guide.pros-cons.step.2': '保存。评价会以两个短列表的形式显示在卡片上。',
  'help.guide.pros-cons.result': '故事下方，一眼就能看到点赞和差评。',
  'help.guide.pros-cons.tip.1': '不用评价的旅程可以在“旅程设置”的“记录字段”下关闭这一部分。',
  // search-journey
  'help.guide.search-journey.title': '在长日记里找东西',
  'help.guide.search-journey.goal': '不用翻过几周的内容，直接找到你要的条目。',
  'help.guide.search-journey.step.1':
    '在工具栏的“在这段旅程中搜索”里输入。时间线会随你输入而过滤，范围包括标题、故事、地点和标签。不区分重音和大小写。',
  'help.guide.search-journey.step.2':
    '页眉的建议开关会在你阅读时隐藏尚未写的卡片。时间线一旦变长，它的下边缘上方会悬浮两个圆形按钮：回到顶部，以及跳到最后一条。',
  'help.guide.search-journey.result': '只留下匹配的条目；清空搜索框即可重新看到全部。',
  'help.guide.search-journey.tip.1': '进行中的旅程在今天这一页打开，所以当前页通常已经在视野里。',
  'help.guide.search-journey.tip.2': '标签也算：搜索“hidden gem”会找到所有打了这个标签的条目。',
  // gallery-map
  'help.guide.gallery-map.title': '浏览图库和地图',
  'help.guide.gallery-map.goal': '把整段旅程当作图片来看，也当作地图上的地点来看。',
  'help.guide.gallery-map.step.1':
    '在工具栏切换到“图库”：每个条目的每张照片，加上直接上传到图库的图片。点击一张即可打开灯箱。',
  'help.guide.gallery-map.step.2':
    '右侧的地图按日期顺序把条目显示为图钉，还有已关联旅行的地点，以及导入到这些旅行中的任何 GPX 轨迹，颜色与它在规划器中的一致。',
  'help.guide.gallery-map.result':
    '悬停在轨迹上可以看到它的名字。条目之间的虚线是 TREK 画的；轨迹则是你实际记录下来的路线。',
  'help.guide.gallery-map.tip.1': '可以在“旅程设置”下为某段旅程关闭轨迹。',
  'help.guide.gallery-map.tip.2': '当“图库”和“地图”都被分享时，带有位置的图库照片也会出现在公开地图上。',
  // entry-fields
  'help.guide.entry-fields.title': '关闭条目字段',
  'help.guide.entry-fields.goal': '让编辑器只保留这段旅程用得到的内容。',
  'help.guide.entry-fields.step.1': '从页眉打开“旅程设置”。',
  'help.guide.entry-fields.step.2': '在“记录字段”下，关闭“心情”、“天气”或“优点与不足”。',
  'help.guide.entry-fields.result':
    '编辑器不再询问这些内容。已写的东西不会丢失：重新打开某个字段会让存储的值再次显示，分享出去的旅程也会隐藏同样的字段。',
  'help.guide.entry-fields.tip.1': '开关是按旅程设置的，所以出差和度假可以不一样。',
  // link-trip
  'help.guide.link-trip.title': '关联另一次旅行',
  'help.guide.link-trip.goal': '把第二次旅行的地点作为建议带进日记。',
  'help.guide.link-trip.step.1': '从页眉打开“旅程设置”。',
  'help.guide.link-trip.step.2': '在已关联的旅行下方，点击“添加旅行”。',
  'help.guide.link-trip.step.3': '选择那次旅行。',
  'help.guide.link-trip.result': '它的地点会作为建议出现在时间线上各自的那一天，它的 GPX 轨迹也会加入地图。',
  'help.guide.link-trip.tip.1': '已关联旅行旁边的 × 会再次取消关联；你写过的条目会保留。',
  'help.guide.link-trip.tip.2': '带日期的条目只计一次，不管有多少次旅行覆盖那一天。',
  // share-public
  'help.guide.share-public.title': '公开分享旅程',
  'help.guide.share-public.goal': '给没有 TREK 账号的人一个只读链接。',
  'help.guide.share-public.step.1': '打开“旅程设置”，找到“公开分享”。',
  'help.guide.share-public.step.2': '点击“创建分享链接”。',
  'help.guide.share-public.step.3':
    '选择访客能看到什么：“时间线”、“图库”和“地图”是各自独立的开关。“复制”会把链接放到你的剪贴板。',
  'help.guide.share-public.result':
    '拿到链接的任何人只能看到已启用的部分，其他什么也看不到；你在“记录字段”里关闭的字段在那里同样保持隐藏。',
  'help.guide.share-public.tip.1':
    '只有“图库”和“地图”都开启时，照片才会出现在公开地图上；“地图”关闭时，照片的坐标会在离开服务器之前被去除。',
  'help.guide.share-public.tip.2': '在同一个地方删除链接即可结束分享。',
  // contributors
  'help.guide.contributors.title': '一起写',
  'help.guide.contributors.goal': '让同行的旅伴添加他们自己的条目和照片。',
  'help.guide.contributors.step.1': '打开“旅程设置”，滚动到贡献者。',
  'help.guide.contributors.step.2': '点击“邀请贡献者”，按名字或邮箱搜索用户。',
  'help.guide.contributors.step.3': '选一个角色并确认。',
  'help.guide.contributors.result': '旅程会出现在他们的列表里，他们的条目会带上他们的名字。用旁边的 × 移除贡献者。',
  'help.guide.contributors.tip.1': '贡献者面向这个 TREK 上的人。对其他所有人，则有公开链接。',
  // studio
  'help.guide.studio.title': '把旅程排成一本相册书',
  'help.guide.studio.goal': '把日记变成可打印的页面。',
  'help.guide.studio.step.1': '点击页眉里的“Studio”。设计器会在旅程之上打开。',
  'help.guide.studio.step.2': '顶栏左侧的旅程名称就是返回的入口；它会把你送回原来的位置。',
  'help.guide.studio.result':
    '左侧是页面栏，工作台上是跨页，右侧是属性。“Auto layout”会用你的条目搭建整本书；“Export”生成可直接打印的 PDF。',
  'help.guide.studio.tip.1': 'Studio 需要至少 1024 px 宽的窗口，手机上不提供。',
  'help.guide.studio.tip.2': '这本书继承旅程的访问权限：能读旅程的人就能打开它，能编辑的人就能保存。',
  // archive-journey
  'help.guide.archive-journey.title': '归档或删除旅程',
  'help.guide.archive-journey.goal': '关闭一段已结束的旅程，或者永久移除一段。',
  'help.guide.archive-journey.step.1': '打开“旅程设置”。',
  'help.guide.archive-journey.step.2':
    '在底部，“归档旅程”会结束它并标记为已归档；“恢复旅程”会把它带回来。“删除”会在确认后把它连同所有条目和照片一起移除。',
  'help.guide.archive-journey.result': '已归档的旅程仍然可以阅读和分享；只是不再在今天这一页打开。',
  'help.guide.archive-journey.tip.1': '删除无法撤销，但不会影响旅程曾关联的旅行。',
  'help.guide.archive-journey.tip.2': '封面、名称和副标题在同一个对话框里，就在顶部。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio 把一段旅程排成可打印的照片书。它在日志之上打开：左侧是页面侧栏和内容，中间是你正在编辑的跨页，右侧是它的属性。Auto layout 根据你的条目生成第一稿；之后的一切由你来移动、裁剪和改样式，每一步都可以撤销。',
  'help.ctx.journey-studio.bullet.1':
    '顶部栏：Back to the journey、Book view、Undo 和 Redo、Page format、Auto layout 和 Export。标题旁的“已保存”标记告诉你书何时已经存好。',
  'help.ctx.journey-studio.bullet.2':
    '左侧侧栏有五个部分：Pages、Content（旅程的照片和条目）、Elements（文字、形状、线条、网格、相框、图标）、“旅程”（由旅程生成的地图、国家、国旗和标记）和 Layouts。',
  'help.ctx.journey-studio.bullet.3':
    '工作区：当前跨页及其出血和安全区，下方的缩放条、Fit to view，以及右侧的“下载此跨页”。',
  'help.ctx.journey-studio.bullet.4':
    '右侧的 Properties：所选对象的位置和大小、裁剪和焦点、Fill 或 Fit、外观、圆角、相框、堆叠顺序和锁定；未选中任何对象时则是页码和文档。',
  'help.ctx.journey-studio.bullet.5':
    '这本书的结构和装订成册的书一样：封面、单独的第一页、各个跨页、单独的最后一页和封底。页码从第一页开始计数，并按显示的样子打印。',
  'help.ctx.journey-studio.bullet.6':
    '多人可以同时设计：每个人都能看到其他人带名字的指针，在别人改过的版本上保存会以冲突的形式返回，而不是覆盖对方的工作。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '自动生成整本书',
  'help.guide.studio-auto-layout.goal': '一键从日志的条目和照片得到完整的第一稿。',
  'help.guide.studio-auto-layout.step.1': '点击顶部栏中的 Auto layout。',
  'help.guide.studio-auto-layout.step.2':
    '选择“整本书”：它会替换每一页，但保留你的标题和页面设置。“本页”只重建屏幕上的这个跨页，且只在由条目生成的跨页上提供。',
  'help.guide.studio-auto-layout.step.3': '翻看 Pages 侧栏。如果你更喜欢原来的样子，Undo 会把整个排版撤回。',
  'help.guide.studio-auto-layout.result':
    '每个条目一个跨页，按顺序排列，照片、标题和故事都已为你放好。每个元素在你编辑它之前都会继续跟随它的条目。',
  'help.guide.studio-auto-layout.tip.1': '这两个选项都是普通的撤销步骤，放心尝试。',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout 绑定到条目的元素会跟随该条目的修改，直到你在 Properties 中动它为止；那会断开链接。',
  // studio-pages
  'help.guide.studio-pages.title': '添加、移动和删除跨页',
  'help.guide.studio-pages.goal': '一页一页地塑造这本书。',
  'help.guide.studio-pages.step.1':
    '在侧栏中打开 Pages。缩略图就是按顺序排列的书：封面、第一页、各个跨页、最后一页、封底。',
  'help.guide.studio-pages.step.2':
    '底部的“添加页面”把新跨页放在最后一页之前；两张缩略图之间的 + 会正好在那里插入一个。',
  'help.guide.studio-pages.step.3':
    '把鼠标悬停在缩略图上可看到它的操作：“前移”、“后移”、“复制页面”和“删除页面”。点击缩略图即可在工作区打开那个跨页。',
  'help.guide.studio-pages.result': '封面、第一页、最后一页和封底留在原处；新跨页总是落在它们之间。',
  'help.guide.studio-pages.tip.1': '顶部栏的 Book view 以纸张的形式显示整本书，也就是装订后的样子。',
  'help.guide.studio-pages.tip.2': '页码在未选中任何对象时，于 Properties 的“文档”下开启。',
  // studio-layouts
  'help.guide.studio-layouts.title': '为跨页应用版式',
  'help.guide.studio-layouts.goal': '给跨页一套现成的照片框和文字框排布。',
  'help.guide.studio-layouts.step.1':
    '在侧栏中打开 Layouts。有十三种跨页版式，以及一组单独用于封面、封底和单页的版式。',
  'help.guide.studio-layouts.step.2': '点击其中一个。工作区中的跨页会采用它的框；你已有的照片和文字会被倒入这些框中。',
  'help.guide.studio-layouts.result': '空框等待内容：从 Content 拖一张照片到框上，或使用 Add to this page。',
  'help.guide.studio-layouts.tip.1': '版式和其他操作一样，也是一个撤销步骤。',
  // studio-content
  'help.guide.studio-content.title': '把照片和条目放到页面上',
  'help.guide.studio-content.goal': '把旅程自己的素材放到跨页上。',
  'help.guide.studio-content.step.1': '在侧栏中打开 Content。Photos 列出旅程的每一张照片；Entries 列出带文字的条目。',
  'help.guide.studio-content.step.2':
    '把照片拖到跨页或空框上，或点击它下方的 Add to this page。“上传照片”可添加旅程中还没有的照片。',
  'help.guide.studio-content.step.3':
    '在条目下方，Title、Story 和 Place 会把那段文字作为文字元素放到页面上；日期和坐标以标记的形式加入，条目的照片也就列在那里。',
  'help.guide.studio-content.result': '放下的照片变成照片元素；文字在你编辑之前会继续跟随条目。',
  'help.guide.studio-content.tip.1': 'Content 顶部的搜索框同时筛选两个列表。',
  'help.guide.studio-content.tip.2': '把文件从桌面拖到工作区，会一步完成上传和放置。',
  // studio-elements
  'help.guide.studio-elements.title': '添加文字、形状和图标',
  'help.guide.studio-elements.goal': '在照片和故事之外装饰跨页。',
  'help.guide.studio-elements.step.1': '在侧栏中打开 Elements。',
  'help.guide.studio-elements.step.2':
    '点击一种用于标题或说明的文字样式、一个形状、一条线、一个网格、一个带相框样式的空框，或可搜索图库中的一个图标。每一个都会落在跨页中央，随时可以移动。',
  'help.guide.studio-elements.result': '双击文字元素即可输入；Properties 里有字体、字重、字号、间距和对齐。',
  'help.guide.studio-elements.tip.1': '相框是空的照片位：以后再把照片放进去。',
  // studio-travel
  'help.guide.studio-travel.title': '添加地图、国旗和数据',
  'help.guide.studio-travel.goal': '把旅程本身变成页面上的数据。',
  'help.guide.studio-travel.step.1': '在侧栏中打开“旅程”。',
  'help.guide.studio-travel.step.2':
    '选择要添加的内容：条目的路线地图、国家轮廓、国家列表或网格、国旗、日期、天数或距离标记，或整个旅行的概览。每一个都由旅程的数据生成，并随之更新。',
  'help.guide.studio-travel.result': '元素出现在跨页上；Properties 调整它的样式，地图还可以调整范围。',
  'help.guide.studio-travel.tip.1': '标记跟随跨页所来自的条目，所以自动排版的跨页上的日期标记已经显示那一天。',
  // studio-properties
  'help.guide.studio-properties.title': '编辑你选中的对象',
  'help.guide.studio-properties.goal': '用检查器移动、裁剪、设置样式和堆叠元素。',
  'help.guide.studio-properties.step.1': '点击跨页上的一个元素。会出现用于大小和旋转的控制点；拖动它即可移动。',
  'help.guide.studio-properties.step.2':
    '右侧的 Properties 跟随所选对象：位置和大小、带焦点的 Crop（焦点决定什么留在框内）、Fill 或 Fit、Look 滤镜、Corner 半径、“相框”样式、堆叠顺序和 Lock。',
  'help.guide.studio-properties.step.3': '“复制”和 Delete 位于检查器顶部；顶部栏的 Undo 可撤销其中任何操作。',
  'help.guide.studio-properties.result':
    '锁定的元素在页面上就再也抓不到了，这样你在周围继续工作时，已完成的排版就不会被碰坏。',
  'help.guide.studio-properties.tip.1': '按住 Shift 点击可选中多个元素；检查器随后会一起编辑它们。',
  'help.guide.studio-properties.tip.2': '编辑 Auto layout 放置的元素会断开它与条目的链接；它不再跟随该条目之后的改动。',
  // studio-format
  'help.guide.studio-format.title': '选择页面格式',
  'help.guide.studio-format.goal': '在排版依赖尺寸之前，先设定这本书要打印的尺寸。',
  'help.guide.studio-format.step.1': '点击顶部栏中的 Page format。',
  'help.guide.studio-format.step.2':
    '选择 Square 21 × 21 cm、Square 30 × 30 cm、A4 或 A5 的横向或纵向，或者以毫米输入自定义的宽和高。出血和安全区就在下方。',
  'help.guide.studio-format.result': '每个跨页都按该尺寸绘制，默认出血 3 mm、安全区 5 mm。',
  'help.guide.studio-format.tip.1': '先改格式，再运行 Auto layout；排版是按它当时找到的尺寸生成的。',
  'help.guide.studio-format.tip.2': '向你的印刷厂询问他们的出血和安全值，然后填入。',
  // studio-export
  'help.guide.studio-export.title': '把书导出为 PDF',
  'help.guide.studio-export.goal': '得到一个可直接印刷的文件，或一个在屏幕上阅读的文件。',
  'help.guide.studio-export.step.1': '点击顶部栏中的 Export。',
  'help.guide.studio-export.step.2':
    '选择“单页”，按阅读顺序每张纸一页，这是印刷厂需要的；或选择“跨页”，像翻开书那样一次两页。“裁切标记”会在每条边上加上出血并标出裁切位置。',
  'help.guide.studio-export.step.3': '点击“打印视图”。浏览器会打开这些页面，“另存为 PDF”把它们变成文件。',
  'help.guide.studio-export.result': '一个 PDF，张数与对话框所说的一致，页面格式为你设定的格式。',
  'help.guide.studio-export.tip.1': '生成 PDF 只能在桌面端进行，和 Studio 本身一样。',
  'help.guide.studio-export.tip.2': '校样用不带裁切标记的“跨页”导出；给印刷厂用带裁切标记的“单页”。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '在另一本书中重用跨页',
  'help.guide.studio-spread-file.goal': '把你喜欢的设计从一段旅程的书带到另一段旅程。',
  'help.guide.studio-spread-file.step.1':
    '跨页在工作区中打开时，点击缩放条右端的“下载此跨页”。文件中保存的是设计，不含照片。',
  'help.guide.studio-spread-file.step.2': '在另一本书里打开 Pages，点击“添加页面”旁边的“导入”，然后选择文件。',
  'help.guide.studio-spread-file.result': '跨页带着它的框和文字样式到达；把新旅程的照片放进这些框里。',
  'help.guide.studio-spread-file.tip.1': '不是跨页设计的文件会被拒绝，并说明原因。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '设置',
  'help.ctx.settings.summary':
    '你的个人设置，左侧边栏里每个主题一个标签页。大多数开关一拨就生效；底部带“保存”按钮的表单要等你点保存。这里的任何改动都不会影响别人的 TREK。',
  'help.ctx.settings.bullet.1':
    '左侧边栏：“显示”“外观”“地图”“通知”“集成”“离线”和“账户”。装了插件后会出现“插件”，运营者没有把它拿掉的地方就会出现“关于”。',
  'help.ctx.settings.bullet.2':
    '“显示”管语言、单位、货币和应用打开时的页面；“外观”管主题、颜色、文本大小和仪表盘组件。',
  'help.ctx.settings.bullet.3':
    '“地图”选择渲染引擎和样式；“通知”选择能联系到你的渠道；“集成”管照片库、API 密钥和 MCP；“离线”管应用在此设备上保留的内容。',
  'help.ctx.settings.bullet.4': '“账户”包含你的资料、密码、双因素认证、通行密钥和删除账户。',
  'help.ctx.settings-display.title': '显示',
  'help.ctx.settings-display.summary':
    '语言、单位和货币，地图与预订的行为方式，以及 TREK 打开时的页面。这里的每项更改都立即生效。',
  'help.ctx.settings-display.bullet.1':
    '“语言与地区”：界面语言、时间格式、每周的第一天、显示货币，以及距离和温度单位。',
  'help.ctx.settings-display.bullet.2':
    '“旅行与地图”：预订路线始终显示在地图上、探索地点的小按钮、从住宿地优化路线、隐藏预订编号，以及给预订路线加标签。',
  'help.ctx.settings-display.bullet.3': '“启动”：TREK 打开时是进入仪表盘还是进行中的旅行，以及旅行的哪个标签页先显示。',
  'help.ctx.settings-appearance.title': '外观',
  'help.ctx.settings-appearance.summary':
    'TREK 在这个账户上的样子：浅色还是深色、强调色、玻璃效果和动态效果、文本大小，以及仪表盘显示哪些组件。一切即时生效，在你登录的每台设备上都一样。',
  'help.ctx.settings-appearance.bullet.1': '“主题”：“浅色”“深色”或“自动”，以及带你自己“自定义强调色”的“配色方案”。',
  'help.ctx.settings-appearance.bullet.2':
    '“可读性”：“透明效果”“减少动态效果”“布局密度”和“文本大小”，还有按层级设置的高级大小。',
  'help.ctx.settings-appearance.bullet.3': '“仪表盘组件”：每个组件一个开关，“桌面端”和“移动端”分开设置。',
  'help.ctx.settings-appearance.bullet.4': '底部的“恢复默认设置”把一切放回原样。',
  'help.ctx.settings-map.title': '地图',
  'help.ctx.settings-map.summary':
    '由哪个引擎以什么样式绘制地图。Leaflet 是经典的栅格地图，MapLibre 不需要任何令牌就能绘制矢量瓦片，Mapbox 用你自己的令牌加上 3D 建筑和地形。',
  'help.ctx.settings-map.bullet.1': '“地图提供商”：Leaflet、MapLibre 或 Mapbox，每个都有一行说明它需要什么。',
  'help.ctx.settings-map.bullet.2': '“地图样式”和“地图模板”：瓦片的外观，加上提供商要求的令牌或密钥。',
  'help.ctx.settings-map.bullet.3': '“高画质模式”提供抗锯齿和地球仪投影；“保存地图”写入你的选择。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'TREK 在应用之外联系你的地方：此设备上的推送通知、一个 ntfy 主题、一个 webhook，或者插件提供的渠道。渠道下方每个事件一行，决定什么发到哪里。',
  'help.ctx.settings-notifications.bullet.1': 'ntfy：主题、可选的自建服务器和可选的访问令牌，点“测试”可以立刻发一条。',
  'help.ctx.settings-notifications.bullet.2': 'Webhook：一个以 JSON 接收所有事件的 URL，带“测试”。',
  'help.ctx.settings-notifications.bullet.3':
    '此设备上的推送通知：“为此设备开启”只对你正在使用的浏览器生效，所以要在每台手机或电脑上各开一次。“发送测试”会发到所有这些设备。',
  'help.ctx.settings-notifications.bullet.4': '偏好设置行：每个事件开启了哪个渠道。插件渠道在设置好之前显示“去配置”。',
  'help.ctx.settings-integrations.title': '集成',
  'help.ctx.settings-integrations.summary':
    '从外部连接到 TREK 的一切：日记用的照片库、脚本用的 API 密钥，以及供 AI 助手使用的 MCP 端点及其令牌和 OAuth 客户端。',
  'help.ctx.settings-integrations.bullet.1':
    '照片提供商：Immich 和 Synology Photos，各有自己的 URL 和密钥、“测试连接”和“保存”。',
  'help.ctx.settings-integrations.bullet.2': '“API 密钥”：供脚本和其他工具以你的名义调用 TREK API 的个人密钥。',
  'help.ctx.settings-integrations.bullet.3': '“MCP 配置”：端点、可直接复制的客户端配置，以及 API 令牌。',
  'help.ctx.settings-integrations.bullet.4':
    '“OAuth 2.1 客户端”：通过 TREK 登录的应用，包括重定向 URI、允许的权限范围、机器客户端和活跃的会话。',
  'help.ctx.settings-offline.title': '离线',
  'help.ctx.settings-offline.summary':
    'TREK 在此设备上保留什么，好让旅行在没有网络时也能打开；以及离线时的更改与别处的更改冲突时会发生什么。',
  'help.ctx.settings-offline.bullet.1':
    '“离线模式”：“强制离线模式”让应用表现得像断网一样，用于测试或按流量计费的连接。',
  'help.ctx.settings-offline.bullet.2': '“为离线做准备”：“下载以供离线使用”现在就获取你的旅行及其地图瓦片。',
  'help.ctx.settings-offline.bullet.3': '“要离线存储的内容”：地图瓦片开或关，以及每次旅行一个开关。',
  'help.ctx.settings-offline.bullet.4':
    '“同步冲突”和“离线缓存”：冲突处理策略、待处理和失败的数量、“立即重新同步”和“清除缓存”。',
  'help.ctx.settings-account.title': '账户',
  'help.ctx.settings-account.summary':
    '你在这个 TREK 上是谁、如何登录：资料和头像、密码、双因素认证、通行密钥，以及最底部的删除账户。',
  'help.ctx.settings-account.bullet.1': '资料：用户名、邮箱和头像，用“保存资料”保存。',
  'help.ctx.settings-account.bullet.2': '“修改密码”：当前密码、新密码两次，然后“更新密码”。',
  'help.ctx.settings-account.bullet.3': '使用身份验证器应用和备用代码的“双因素认证 (2FA)”；不用密码登录的“通行密钥”。',
  'help.ctx.settings-account.bullet.4': '底部的“删除账户”，需要先确认。最后一位管理员不能删除自己。',
  // language-region
  'help.guide.language-region.title': '设置语言、单位和货币',
  'help.guide.language-region.goal': '让 TREK 说你的语言，按你的方式计数。',
  'help.guide.language-region.step.1': '在“语言与地区”中选择界面语言。TREK 立即切换，在你登录的每台设备上都一样。',
  'help.guide.language-region.step.2':
    '在它下方选择时间格式、所有日期选择器中每周从哪一天开始、显示货币，以及距离和温度单位。',
  'help.guide.language-region.result': '日期、距离和金额按你期望的方式显示；旅行自己的货币仍然显示在换算金额旁边。',
  'help.guide.language-region.tip.1': '显示货币用于跨旅行的合计；每次旅行保留你给它设定的货币。',
  'help.guide.language-region.tip.2': '语言还决定 Vacay 和日记里的星期和月份名称。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '调整地图和预订的行为',
  'help.guide.travel-map-prefs.goal': '决定旅行地图默认显示什么。',
  'help.guide.travel-map-prefs.step.1':
    '在“旅行与地图”中，“始终显示预订路线”让航班和火车即使在它们的日期未打开时也留在地图上；“在地图上探索地点”显示查找地点的小按钮；“从住宿地优化路线”从你过夜的地方开始规划路线。',
  'help.guide.travel-map-prefs.step.2':
    '“隐藏预订编号”把确认号隐藏起来，悬停才显示；“预订路线标签”把预订名称写在它的路线旁。',
  'help.guide.travel-map-prefs.result': '旅行地图在每次旅行中都遵循这些设置，直到你再拨回去。',
  'help.guide.travel-map-prefs.tip.1': '这些是按账户而不是按旅行设置的。共享旅行的成员各自看到自己的选择。',
  // startup
  'help.guide.startup.title': '选择 TREK 打开时的页面',
  'help.guide.startup.goal': '落在你最常工作的地方，而不是每次都进仪表盘。',
  'help.guide.startup.step.1': '在“启动”下，把“启动页面”设为“仪表盘”或“进行中的旅行”。',
  'help.guide.startup.step.2': '“启动标签页”决定打开一次旅行时先显示哪个标签页。',
  'help.guide.startup.result': '下次登录和下次点击 logo 都直接去那里。',
  'help.guide.startup.tip.1': '“进行中的旅行”指今天正在进行的旅行，没有的话就是下一次旅行。',
  // theme-scheme
  'help.guide.theme-scheme.title': '设置主题和强调色',
  'help.guide.theme-scheme.goal': '让 TREK 用浅色、深色或跟随你的设备，配上你喜欢的颜色。',
  'help.guide.theme-scheme.step.1': '在“主题”下选择“浅色”“深色”或“自动”。“自动”跟随你的设备。',
  'help.guide.theme-scheme.step.2': '选择一个“配色方案”：“默认”“高对比度”“靛蓝”“蓝绿”“玫瑰”“琥珀”“紫罗兰”或“自定义”。',
  'help.guide.theme-scheme.step.3':
    '选“自定义”时，从预设里挑一个强调色或输入你自己的。旁边的对比度检查会告诉你文字在这个颜色上是否仍然清晰可读。',
  'help.guide.theme-scheme.result': '按钮、链接和高亮到处都用这个强调色，在你登录的每台设备上都一样。',
  'help.guide.theme-scheme.tip.1': '导航栏里也有一个浅色或深色的快捷开关；它设置的是同一个主题。',
  'help.guide.theme-scheme.tip.2': '当默认配色看起来太淡时，就选“高对比度”。',
  // readability
  'help.guide.readability.title': '调整可读性和文本大小',
  'help.guide.readability.goal': '少一点玻璃效果，少一点动态效果，多一点空间或更大的字。',
  'help.guide.readability.step.1':
    '在“可读性”下，“透明效果”把玻璃面板切换为实色表面，“减少动态效果”把动画降到最少，“布局密度”在“舒适”和“紧凑”之间选择。',
  'help.guide.readability.step.2':
    '“文本大小”一次缩放“全部”；“高级文本大小”让标题、副标题、正文和说明文字可以各不相同。',
  'help.guide.readability.result': '整个应用立即跟随，包括地图面板和日记。',
  'help.guide.readability.tip.1': '不去动“减少动态效果”时，它还会跟随你系统的设置。',
  'help.guide.readability.tip.2': '文本大小通过排版层级应用，所以不会有内容被截断；放不下的尺寸会换行。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '选择仪表盘组件',
  'help.guide.dashboard-widgets.goal': '只显示你用的组件，桌面端和手机分开设置。',
  'help.guide.dashboard-widgets.step.1':
    '在“仪表盘组件”下，为“桌面端”和“移动端”分别打开或关闭每个组件：整个右侧边栏、货币、Collections、时区、即将到来的预订、Atlas 国家和旅行数据。',
  'help.guide.dashboard-widgets.step.2': '底部的“恢复默认设置”把整个标签页恢复到出厂状态。',
  'help.guide.dashboard-widgets.result': '仪表盘立即重新排列；关掉右侧边栏后它会居中。',
  'help.guide.dashboard-widgets.tip.1': '扩展的组件只有在管理员开启了那个扩展时才会出现。',
  'help.guide.dashboard-widgets.tip.2': '仪表盘本身会按设备记住你的网格或列表视图以及排序方式。',
  // map-provider
  'help.guide.map-provider.title': '选择地图引擎和样式',
  'help.guide.map-provider.goal': '在经典地图、矢量瓦片和 Mapbox 的 3D 地图之间切换。',
  'help.guide.map-provider.step.1':
    '在“地图提供商”下，选 Leaflet 得到可用任意栅格瓦片的经典 2D 地图，选 MapLibre 得到无需令牌的 OpenFreeMap 矢量瓦片，选 Mapbox 得到带 3D 建筑和地形的矢量瓦片。',
  'help.guide.map-provider.step.2':
    '选一个“地图样式”或“地图模板”决定外观。Mapbox 需要“Mapbox 访问令牌”，一些栅格样式需要“CARTO API 密钥”；字段旁边的链接会带你去获取。',
  'help.guide.map-provider.step.3': '“高画质模式”加上抗锯齿和地球仪投影。点击“保存地图”。',
  'help.guide.map-provider.result': 'TREK 里的每张地图，旅行、Atlas、Collections 和日记，都由你选的引擎绘制。',
  'help.guide.map-provider.tip.1': '没有令牌时，Mapbox 会退回默认地图，而不是什么都不显示。',
  'help.guide.map-provider.tip.2': '你离线存储的地图瓦片来自下载时处于活动状态的提供商。',
  // notification-channels
  'help.guide.notification-channels.title': '设置通知送达的地方',
  'help.guide.notification-channels.goal': '在手机上或另一个工具里收到旅行提醒和协作事件。',
  'help.guide.notification-channels.step.1':
    '在“通知”下填写“Ntfy 主题”；如果你自己运行服务器，再加上你的“Ntfy 服务器 URL”和“访问令牌”。“测试”会立刻发一条消息。',
  'help.guide.notification-channels.step.2': '或者填一个以 JSON 接收所有事件的“Webhook URL”，用同样的方式“测试”它。',
  'help.guide.notification-channels.step.3':
    '在下方的行里，按渠道打开或关闭每个事件。插件渠道在插件设置里配置好之前显示“去配置”；“发送测试”会试发一条。',
  'help.guide.notification-channels.result': '事件通过开启的渠道发出。无论如何，导航栏里的铃铛仍会在应用内显示它们。',
  'help.guide.notification-channels.tip.1': '按旅行的偏好设置在旅行本身的通知设置里。',
  'help.guide.notification-channels.tip.2': '管理员可以为所有人预填一个默认 ntfy 服务器；主题仍由你自己选。',
  // photo-providers
  'help.guide.photo-providers.title': '连接照片库',
  'help.guide.photo-providers.goal': '让日记从 Immich 或 Synology Photos 拉取当天的照片。',
  'help.guide.photo-providers.step.1':
    '在“集成”下找到提供商的部分，输入它的 URL 和 API 密钥。Immich 还可以把旅程上传的照片镜像回照片库。',
  'help.guide.photo-providers.step.2': '点击“测试连接”，然后“保存”。',
  'help.guide.photo-providers.result':
    '条目编辑器的“External photos”标签页会在已连接的照片库中搜索该条目当天的照片，离条目位置最近的排在前面。',
  'help.guide.photo-providers.tip.1': '这个连接是你自己的：旅程的其他成员各自连接自己的照片库。',
  'help.guide.photo-providers.tip.2': '照片里没有 GPS 数据的提供商也能用；那时列表按时间排序。',
  // api-keys
  'help.guide.api-keys.title': '创建 API 密钥',
  'help.guide.api-keys.goal': '让脚本或其他工具以你的身份调用 TREK API。',
  'help.guide.api-keys.step.1': '在“API 密钥”下点击“创建密钥”，起一个能说明它用在哪里的名字。',
  'help.guide.api-keys.step.2': '从对话框里复制密钥：它只显示一次。当工具不再需要时，从列表里删除密钥。',
  'help.guide.api-keys.result': '带这个密钥的请求以你的权限执行；列表显示每个密钥的创建时间和最后使用时间。',
  'help.guide.api-keys.tip.1': '每个工具一个密钥，撤销起来毫不费力。',
  'help.guide.api-keys.tip.2': 'AI 助手请改用带 OAuth 的 MCP；API 密钥是给普通 HTTP 客户端的。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': '通过 MCP 连接 AI 助手',
  'help.guide.mcp-oauth.goal': '让 Claude、IDE 或其他 MCP 客户端访问你的旅行。',
  'help.guide.mcp-oauth.step.1': '在“MCP 配置”下复制“MCP 端点”，或者为接受 JSON 片段的客户端复制整个“客户端配置”。',
  'help.guide.mcp-oauth.step.2':
    '通过浏览器登录的客户端使用 OAuth 2.1：在“OAuth 2.1 客户端”下“新建客户端”，填写“重定向 URI”“允许的权限范围”，没有浏览器的服务器则选“机器客户端”。',
  'help.guide.mcp-oauth.step.3':
    '每个客户端上都有“轮换密钥”和“删除客户端”；“活跃的 OAuth 会话”列出已登录的会话并让你撤销。“API 令牌”和“创建新令牌”是较早的接入方式。',
  'help.guide.mcp-oauth.result': '客户端可以以你的身份读取和修改其权限范围允许的内容，每个操作都显示在你的名下。',
  'help.guide.mcp-oauth.tip.1': '权限范围是安全网：在客户端需要更多之前，只给它读取范围。',
  'help.guide.mcp-oauth.tip.2': '管理员可以为整个实例关闭 MCP；那时这个部分就不存在。',
  // offline-prepare
  'help.guide.offline-prepare.title': '把旅行带到离线',
  'help.guide.offline-prepare.goal': '在断网之前，把你的旅行和地图放到这台设备上。',
  'help.guide.offline-prepare.step.1':
    '在“要离线存储的内容”下，保持“离线存储地图瓦片”开启，并打开你想放到这台设备上的旅行。',
  'help.guide.offline-prepare.step.2': '在“为离线做准备”下点击“下载以供离线使用”。它会获取旅行以及地点周围的瓦片。',
  'help.guide.offline-prepare.step.3': '“离线模式”下的“强制离线模式”让你在出发前检查一切是否齐全。',
  'help.guide.offline-prepare.result': '旅行在没有网络时也能打开；你做的更改在队列里等待，重新联网后发出。',
  'help.guide.offline-prepare.tip.1': '瓦片占的空间最多：“离线缓存”部分按旅行显示存储了什么。',
  'help.guide.offline-prepare.tip.2': '从浏览器把 TREK 安装为应用，离线启动最顺畅。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '决定同步冲突时谁胜出',
  'help.guide.offline-conflicts.goal': '选择 TREK 如何处理离线更改与别处更改之间的冲突。',
  'help.guide.offline-conflicts.step.1': '在“同步冲突”下，选择“每次询问我”“始终保留我的版本”或“始终保留服务器版本”。',
  'help.guide.offline-conflicts.step.2':
    '“离线缓存”显示旅行、待处理和失败的更改以及冲突；“立即重新同步”推送队列，“清除缓存”清空设备。',
  'help.guide.offline-conflicts.result': '选“每次询问我”时，冲突会显示两个版本让你挑；另外两种则静默处理。',
  'help.guide.offline-conflicts.tip.1': '“清除缓存”只移除这台设备上的副本；服务器上的内容不受影响。',
  // profile
  'help.guide.profile.title': '修改你的资料',
  'help.guide.profile.goal': '更新你的名字、邮箱和照片。',
  'help.guide.profile.step.1': '在“账户”下编辑“用户名”和“邮箱”。头像可以上传你自己的图片；移除后回到首字母。',
  'help.guide.profile.step.2': '点击“保存资料”。',
  'help.guide.profile.result': '你的名字和照片立即在各处更新，包括你共享的旅行。',
  'help.guide.profile.tip.1': '通过 OIDC 登录的账户会在这里显示出来；那时邮箱来自身份提供商。',
  // password
  'help.guide.password.title': '修改你的密码',
  'help.guide.password.goal': '设置一个新密码。',
  'help.guide.password.step.1': '在“修改密码”下输入当前密码，然后输入新密码两次。',
  'help.guide.password.step.2': '点击“更新密码”。',
  'help.guide.password.result': '新密码从下次登录起生效；其他会话保持登录。',
  'help.guide.password.tip.1': '通过 OIDC 登录的账户没有可修改的 TREK 密码。',
  // mfa
  'help.guide.mfa.title': '开启双因素认证',
  'help.guide.mfa.goal': '用身份验证器应用的验证码保护账户。',
  'help.guide.mfa.step.1': '在“双因素认证 (2FA)”下点击“设置身份验证器”。',
  'help.guide.mfa.step.2': '用你的应用扫描二维码，或手动输入密钥，然后输入它显示的六位验证码并点击“启用 2FA”。',
  'help.guide.mfa.step.3': '保存备用代码：复制、下载或打印。每个只能用一次，在你手边没有手机时使用。',
  'help.guide.mfa.result': '每次登录在密码之后都会要求验证码。',
  'help.guide.mfa.tip.1': '“停用 2FA”需要你的密码和一个当前验证码。',
  'help.guide.mfa.tip.2': '管理员可以要求所有人使用 2FA；那时在这里无法关闭。',
  // passkeys
  'help.guide.passkeys.title': '用通行密钥登录',
  'help.guide.passkeys.goal': '用设备的指纹、面容或 PIN 代替密码。',
  'help.guide.passkeys.step.1': '在“通行密钥”下点击“添加通行密钥”，并在设备上确认。起一个能说明是哪台设备的名字。',
  'help.guide.passkeys.step.2': '列表显示每个通行密钥的名称和最后使用时间；删除按钮移除一个。',
  'help.guide.passkeys.result': '登录页会提供通行密钥；密码仍作为备用方式保留。',
  'help.guide.passkeys.tip.1': '通行密钥保存在设备或它的密码管理器里，所以每台设备添加一个。',
  'help.guide.passkeys.tip.2': '通行密钥需要 HTTPS；在纯 HTTP 的实例上，这个部分会解释为什么它们不可用。',
  // delete-account
  'help.guide.delete-account.title': '删除你的账户',
  'help.guide.delete-account.goal': '移除你的账户和只属于你的数据。',
  'help.guide.delete-account.step.1': '在“账户”的最底部点击“删除账户”并确认。',
  'help.guide.delete-account.result': '你的账户、你自己的旅行和你的旅程都会消失；你与他人共享的旅行留给他们。',
  'help.guide.delete-account.tip.1': '实例的最后一位管理员不能删除自己；先把别人设为管理员。',
  'help.guide.delete-account.tip.2': '没有撤销。确认之前，先导出你想保留的内容。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理后台',
  'help.ctx.admin.summary':
    '支撑所有人 TREK 的那个实例：谁可以登录、怎么登录，什么功能开着，文件放在哪里，服务器怎么联系到人，以及怎么备份。只有管理员能看到这个页面；每个标签页在侧边栏里都是独立的一屏。',
  'help.ctx.admin.bullet.1': '顶部的四张卡片统计用户、行程、地点和文件；上方的横幅会通告更新的 TREK 版本。',
  'help.ctx.admin.bullet.2': '“用户”和“用户默认设置”：账户、邀请链接，以及新账户初始的地图设置。',
  'help.ctx.admin.bullet.3':
    '“个性化”“设置”“扩展”和“插件”：打包模板、分类和学校假期；登录方式和 API 密钥；功能模块；第三方插件。',
  'help.ctx.admin.bullet.4':
    '“存储”“通知”“MCP 访问”和“GitHub”：上传文件的去向、实例范围的通知渠道、AI 客户端的令牌和会话，以及版本历史。',
  'help.ctx.admin.bullet.5': '“备份”和“审计”：手动和定时的备份，以及安全相关事件的日志。',
  'help.ctx.admin-users.title': '用户',
  'help.ctx.admin-users.summary':
    '这个 TREK 上的每个账户，带角色、邮箱和最近登录时间，以及让人们在封闭实例上注册的邀请链接。',
  'help.ctx.admin-users.bullet.1': '表格：用户名、邮箱、角色、创建日期、最近登录，以及每行的操作。你自己会被标出来。',
  'help.ctx.admin-users.bullet.2': '顶部的“创建用户”手动添加一个账户，密码由你交给对方。',
  'help.ctx.admin-users.bullet.3':
    '下方的“邀请链接”：一次性的注册链接，带使用次数上限和有效期，还可以选一个行程，让新用户注册后直接加入。',
  'help.ctx.admin-users.bullet.4':
    '底部的“权限设置”：按操作设定谁可以执行，“所有人”“旅行成员”“旅行所有者”或“仅管理员”。',
  'help.ctx.admin-defaults.title': '用户默认设置',
  'help.ctx.admin-defaults.summary': '新账户初始的设置，这样没人需要先去找地图标签页：地图提供商、样式、令牌和质量。',
  'help.ctx.admin-defaults.bullet.1':
    '地图提供商、Mapbox 样式和令牌、CARTO 密钥和 Mapbox 质量，和用户在“设置”的“地图”里设置的一模一样。',
  'help.ctx.admin-defaults.bullet.2': '每个字段旁的“重置”恢复 TREK 自身的选择；用户自己的设置永远优先于这些默认值。',
  'help.ctx.admin-config.title': '个性化',
  'help.ctx.admin-config.summary':
    '实例上所有行程共用的内容：打包模板、地点和收藏用的分类集合，以及假期功能所引用的学校假期目录。',
  'help.ctx.admin-config.bullet.1': '“打包模板”：带名称的分类和物品清单，行程的打包清单可以由此起步。',
  'help.ctx.admin-config.bullet.2': '“分类”：TREK 全局使用的分类的名称、图标和颜色，从地点检视器到收藏都在用。',
  'help.ctx.admin-config.bullet.3': '“学校假期”：国家和地区的目录，用于内置数据源未覆盖的地方。',
  'help.ctx.admin-settings.title': '设置',
  'help.ctx.admin-settings.summary':
    '人们怎么进来，服务器可以和什么通信：登录和注册方式、SSO、通行密钥、双因素策略，地图、地点和图片的 API 密钥，搜索和公共交通的数据源，以及上传允许的文件类型。',
  'help.ctx.admin-settings.bullet.1':
    '“登录方式”：“密码登录”“密码注册”“SSO 登录”“SSO 自动创建账户”和“要求双因素身份验证（2FA）”。',
  'help.ctx.admin-settings.bullet.2':
    '“单点登录 (OIDC)”填颁发者、客户端和显示名称；“通行密钥登录”填 Relying Party ID 和来源。',
  'help.ctx.admin-settings.bullet.3':
    '“API 密钥”：Google Maps、Unsplash 和高德地图，各自带“测试”；“该密钥的用途”把 Google 密钥限定在你愿意付费的功能上。',
  'help.ctx.admin-settings.bullet.4':
    '“地点搜索源”和“公共交通数据源”决定由谁响应搜索和路线；“允许的文件类型”限制上传。',
  'help.ctx.admin-addons.title': '扩展',
  'help.ctx.admin-addons.summary':
    'TREK 的功能模块，每个都有一个开关：列表、费用、文档、Vacay、Atlas、协作、旅程、收藏、公路旅行、MCP、AirTrail、Dawarich 和 AI 解析。关掉后，导航项、路由和 API 对所有人都消失。',
  'help.ctx.admin-addons.bullet.1': '每个扩展一张卡片，带开关；有选项的还有子行。',
  'help.ctx.admin-addons.bullet.2':
    '照片提供商和文档提供商也以卡片的形式出现在这里，这样可以向用户提供 Immich 或 Synology。',
  'help.ctx.admin-addons.bullet.3': '“行李追踪”在卡片下方有自己的开关。',
  'help.ctx.admin-plugins.title': '插件',
  'help.ctx.admin-plugins.summary':
    '在 TREK 旁边以独立进程运行的第三方插件，每个都带有安装时申请的权限。可以从目录安装、上传一个包，或在开发时链接一个文件夹。',
  'help.ctx.admin-plugins.bullet.1':
    '列表：每个已安装的插件，带版本、状态、签名和它持有的权限；每行可以激活、停用、更新或卸载。',
  'help.ctx.admin-plugins.bullet.2': '“上传插件”接收一个包文件；“重新扫描”会拾取为开发而链接的插件文件夹。',
  'help.ctx.admin-plugins.bullet.3': '每个插件的“允许的主机”：插件可以调用的地址，因为对外访问默认被拒绝。',
  'help.ctx.admin-storage.title': '存储',
  'help.ctx.admin-storage.summary':
    '上传文件存放的地方：本地磁盘、S3 存储桶，或者同时写入两者的镜像。每个上传分类可以走不同的后端，“健康状态”告诉你是否每个后端都在响应。',
  'help.ctx.admin-storage.bullet.1':
    '“后端”：每个后端的名称和类型，带“测试”“编辑”和“移除”；由环境变量设定的后端在这里是只读的。',
  'help.ctx.admin-storage.bullet.2':
    '“分类”：封面、文档、旅程照片等，每一类都指派给一个后端；改动某一类时会提议迁移现有文件。',
  'help.ctx.admin-storage.bullet.3': '“健康状态”：每个后端一项检查，还有一个种子文件，证明配置就是服务器所看到的配置。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    '实例向用户提供的渠道，以及能联系到你这位管理员的渠道。用户在“设置”里选自己的主题和 URL；你决定有哪些渠道，并配置邮件。',
  'help.ctx.admin-notifications.bullet.1':
    '“应用内通知”“电子邮件（SMTP）”“Ntfy”“Webhook”和“Web 推送”：各一个面板，带一个向用户开放该渠道的开关，以及它需要的服务器端配置。',
  'help.ctx.admin-notifications.bullet.2': '“行程提醒”：服务器是否在行程开始前发送提醒。',
  'help.ctx.admin-notifications.bullet.3':
    '“管理员 Ntfy”和“管理员 Webhook”：备份失败或新版本发布这类管理员事件的去向，带“测试”。',
  'help.ctx.admin-mcp-tokens.title': 'MCP 访问',
  'help.ctx.admin-mcp-tokens.summary':
    'AI 客户端针对这个 TREK 持有的每个令牌和 OAuth 会话，覆盖所有用户，并且可以撤销其中任何一个。',
  'help.ctx.admin-mcp-tokens.bullet.1': '“API 令牌”：谁创建的、最近何时使用，以及“删除”。',
  'help.ctx.admin-mcp-tokens.bullet.2': '“OAuth 会话”：客户端、用户和被授予的范围，以及“撤销”。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK 有什么新内容：来自 GitHub 的版本历史、你运行的版本，以及是否有更新的版本。更新本身在应用之外、在主机上进行。',
  'help.ctx.admin-github.bullet.1': '“版本历史”列出各个版本及其说明；最新的一个带“最新”，你的版本会被标出。',
  'help.ctx.admin-github.bullet.2':
    '一旦有更新的版本，页眉会出现“有可用更新”，并附上 Docker 和其他安装方式的更新方法。',
  'help.ctx.admin-backup.title': '备份',
  'help.ctx.admin-backup.summary':
    '数据库和上传文件的完整备份，可手动或定时创建，保存在服务器上，并可作为单个文件下载。“恢复”把备份放回去。',
  'help.ctx.admin-backup.bullet.1': '“数据备份”：“创建备份”，以及现有备份的列表，带“下载”“恢复”和删除。',
  'help.ctx.admin-backup.bullet.2': '“上传备份”导入在另一个实例上或更早某天制作的文件。',
  'help.ctx.admin-backup.bullet.3': '“自动备份”：开或关、间隔、时间和日期，以及保留多少个。',
  'help.ctx.admin-audit.title': '审计',
  'help.ctx.admin-audit.summary':
    '安全相关和管理事件的日志：登录和失败、MFA 变更、用户和设置变更、备份和恢复。只读，最新的在前。',
  'help.ctx.admin-audit.bullet.1': '每个事件一行，带时间、用户、操作、资源、IP 和详情。',
  'help.ctx.admin-audit.bullet.2': '“刷新”重新加载；“加载更多”继续往回翻。',
  // create-user
  'help.guide.create-user.title': '创建用户',
  'help.guide.create-user.goal': '不用邀请，手动添加一个账户。',
  'help.guide.create-user.step.1': '点击“用户”标签页顶部的“创建用户”。',
  'help.guide.create-user.step.2': '输入“用户名”“邮箱”和“密码”，并选择“角色”：“用户”或“管理员”。',
  'help.guide.create-user.step.3': '点击“创建用户”。',
  'help.guide.create-user.result': '账户出现在表格里，可以立即登录；请通过你信任的渠道把密码交给对方。',
  'help.guide.create-user.tip.1': '对于应该自己选密码的人，邀请链接是更好的入口。',
  'help.guide.create-user.tip.2': '管理员能看到这个页面和审计日志；其他一切对两种角色都一样。',
  // edit-user
  'help.guide.edit-user.title': '更改用户的角色或密码',
  'help.guide.edit-user.goal': '提升或降级某人，或在对方丢失密码后让其重新登录。',
  'help.guide.edit-user.step.1': '点击该用户所在行的铅笔。“编辑用户”会带着账户详情打开。',
  'help.guide.edit-user.step.2':
    '更改“角色”，设置“新密码”，或者在对方丢失了存放通行密钥的设备时点击“重置通行密钥”，然后“保存”。',
  'help.guide.edit-user.result': '更改从下一次请求起生效；新密码从下一次登录起可用。',
  'help.guide.edit-user.tip.1': '只要你还是最后一位管理员，就不能去掉自己的管理员角色。',
  'help.guide.edit-user.tip.2': '重置通行密钥会保留密码；对方在“设置”的“账户”里添加新的通行密钥。',
  // invite-links
  'help.guide.invite-links.title': '用链接邀请某人',
  'help.guide.invite-links.goal': '让一个人在封闭实例上注册，还可以让其直接进入某个行程。',
  'help.guide.invite-links.step.1': '在“邀请链接”下点击“创建链接”。',
  'help.guide.invite-links.step.2': '设置“最大使用次数”和“有效期”，可选地“添加到行程（可选）”，然后点击“创建并复制”。',
  'help.guide.invite-links.step.3':
    '把链接发出去。每一行显示它被使用了多少次以及由谁创建；“复制链接”可再次复制，用完或过期的链接会被标出。',
  'help.guide.invite-links.result': '打开链接的人用自己的密码注册，如果选了行程，就会直接加入。',
  'help.guide.invite-links.tip.1': '即使“设置”里关闭了“密码注册”，邀请链接也照样有效。',
  'help.guide.invite-links.tip.2': '只用一次、有效期很短的链接，是给单个人的最安全默认。',
  // delete-user
  'help.guide.delete-user.title': '删除用户',
  'help.guide.delete-user.goal': '移除一个账户以及只属于它的一切。',
  'help.guide.delete-user.step.1': '点击该用户所在行的垃圾桶图标，并确认“删除用户”。',
  'help.guide.delete-user.result': '账户、它自己的行程和旅程都没了；与他人共享的行程留给其余成员。',
  'help.guide.delete-user.tip.1': '没有撤销。不确定的话先做个备份。',
  'help.guide.delete-user.tip.2': '最后一位管理员不能被删除；先把别人设为管理员。',
  // permissions
  'help.guide.permissions.title': '决定谁可以做什么',
  'help.guide.permissions.goal': '按操作设定在这个 TREK 上允许哪个角色执行。',
  'help.guide.permissions.step.1':
    '在“权限设置”里，在对应分组中找到该操作，比如“旅行管理”下的“删除旅行”，然后选择级别：“所有人”“旅行成员”“旅行所有者”或“仅管理员”。改动过的行会标为“已自定义”。',
  'help.guide.permissions.step.2': '点击“保存”。“恢复默认”把每一行都放回内置级别。',
  'help.guide.permissions.result': '规则一次性对所有旅行生效；级别不够的人的按钮和菜单会消失。',
  'help.guide.permissions.tip.1': '“旅行所有者”指创建该旅行的人；管理员始终可以做任何事。',
  'help.guide.permissions.tip.2': '宁可降低级别，也不要删除成员：不能编辑的成员仍然可以查看和评论。',
  // default-map
  'help.guide.default-map.title': '为新用户设置地图默认值',
  'help.guide.default-map.goal': '让每个新账户不用个人令牌也有一张能用的地图。',
  'help.guide.default-map.step.1':
    '在“地图”下选择“地图引擎”；对于 Mapbox 或 MapLibre，设置“地图样式”“共享 Mapbox 令牌”和“高质量模式”；对于栅格地图，设置“地图模板”和“共享 CARTO 密钥”。',
  'help.guide.default-map.step.2':
    '在你改过的任何字段旁，“重置”恢复 TREK 自身的选择。左侧的“用户默认设置”对“颜色模式”、单位和货币做同样的事。',
  'help.guide.default-map.result': '新账户以这些设置起步；任何在“设置”里设过自己地图的人保留自己的。',
  'help.guide.default-map.tip.1': '在这里输入的令牌由所有没有自己令牌的人共用，所以留意它的配额。',
  'help.guide.default-map.tip.2': '从未动过地图标签页的现有账户也会遵循这些默认值。',
  // packing-templates
  'help.guide.packing-templates.title': '创建打包模板',
  'help.guide.packing-templates.goal': '让行程有一份可以起步的打包清单，而不是空白一片。',
  'help.guide.packing-templates.step.1': '点击“新建模板”，输入名称，用对勾确认。',
  'help.guide.packing-templates.step.2': '打开模板并点击“添加分类”；每个分类下的 + 添加物品，物品只需要一个名称。',
  'help.guide.packing-templates.step.3': '一切随手保存。铅笔重命名模板、分类或物品，垃圾桶删除它。',
  'help.guide.packing-templates.result': '每个行程的打包清单都会提供这个模板；套用时会复制物品，所以行程可以随意修改。',
  'help.guide.packing-templates.tip.1': '按行程类型各建一个模板，比如海滩、城市、徒步，胜过一份巨大的清单。',
  'help.guide.packing-templates.tip.2': '删除模板不影响已经套用它的行程。',
  // categories
  'help.guide.categories.title': '管理分类集合',
  'help.guide.categories.goal': '决定地点和收藏可以带哪些分类，以及它们的样子。',
  'help.guide.categories.step.1': '点击“新建分类”，起个名字，选一个图标和一种颜色；“预览”显示效果。点击“创建”。',
  'help.guide.categories.step.2': '把鼠标悬停在列表中的分类上即可编辑或删除。删除会要求确认。',
  'help.guide.categories.result': '这个集合同时应用到所有地方：地点检视器、地图图钉、收藏和筛选器。',
  'help.guide.categories.tip.1': '地点保留的是分类 ID，所以重命名一个分类会在每个地点上一并改名。',
  'help.guide.categories.tip.2': '被删除的分类会让它的地点没有分类；如果这很重要，先重新指派。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '手动维护学校假期',
  'help.guide.school-holiday-catalog.goal': '补上内置假期数据源没有覆盖的国家或地区。',
  'help.guide.school-holiday-catalog.step.1':
    '在“学校假期”下点击“添加国家”，输入“国家”和它的“国家代码（如 US）”，然后“保存”；再为每个有差异的部分“添加地区”。',
  'help.guide.school-holiday-catalog.step.2':
    '点击一个地区打开“地区或学区”：“添加假期”，为每一段填上“假期名称”“开始日期”和“结束日期”，然后“保存”。垃圾桶移除一段假期、一个地区，或者一个已经没有地区的国家。',
  'help.guide.school-holiday-catalog.result': '用户在 Vacay 的“设置”里能找到该国家和地区，并在年历网格上看到这些假期。',
  'help.guide.school-holiday-catalog.tip.1':
    '来自内置数据源的地区不能在这里编辑；如果某个日期有误，就在旁边添加一个手动地区。',
  // auth-methods
  'help.guide.auth-methods.title': '决定人们如何登录',
  'help.guide.auth-methods.goal': '开放或关闭密码登录、SSO 和注册，并要求 2FA。',
  'help.guide.auth-methods.step.1':
    '在“登录方式”下打开或关闭“密码登录”和“密码注册”。关闭注册意味着新账户只能通过邀请链接、SSO 或手动创建。',
  'help.guide.auth-methods.step.2':
    '“SSO 登录”和“SSO 自动创建账户”需要在下方配置好“单点登录 (OIDC)”；自动创建账户会在某人第一次通过 SSO 登录时创建账户。',
  'help.guide.auth-methods.step.3':
    '“要求双因素身份验证（2FA）”让每个密码登录的用户在下次登录时设置验证器。“通行密钥登录”需要 Relying Party ID 以及访问你的 TREK 所用的来源。',
  'help.guide.auth-methods.result': '登录页面只提供你保持开启的那些方式。',
  'help.guide.auth-methods.tip.1': '在你把自己锁在门外之前会出现警告：至少会保留一条管理员的登录途径。',
  'help.guide.auth-methods.tip.2': '通过环境变量设置的值在这里显示为只读。',
  // oidc
  'help.guide.oidc.title': '接入单点登录',
  'help.guide.oidc.goal': '让人们用你的身份提供商登录。',
  'help.guide.oidc.step.1':
    '在“单点登录 (OIDC)”下输入按钮的“显示名称”，以及来自你的提供商的“颁发者 URL”“Client ID”和“Client Secret”，然后“保存”。',
  'help.guide.oidc.step.2': '在“登录方式”下打开“SSO 登录”。',
  'help.guide.oidc.result': '登录页面显示 SSO 按钮；开启“SSO 自动创建账户”后，首次登录的用户会自动获得账户。',
  'help.guide.oidc.tip.1': '你的提供商需要的重定向 URI 是你的 TREK 地址加上文档里的 OIDC 回调路径。',
  'help.guide.oidc.tip.2': '声明映射决定哪些 SSO 群组成为管理员；见文档中的 OIDC 页面。',
  // instance-keys
  'help.guide.instance-keys.title': '输入 API 密钥',
  'help.guide.instance-keys.goal': '为整个实例解锁 Google 地点搜索、Unsplash 封面和高德地图。',
  'help.guide.instance-keys.step.1': '在“API 密钥”下粘贴“Google Maps API 密钥”并点击“测试”；字段会告诉你密钥是否响应。',
  'help.guide.instance-keys.step.2':
    '在“该密钥的用途”下只打开你愿意用该密钥付费的功能：自动补全、详情、照片、信息补充、地点搜索记录。',
  'help.guide.instance-keys.step.3':
    '“Unsplash API 密钥”驱动封面搜索；“高德地图 API Key”驱动中国境内的地点搜索。用同样的方式逐个测试。',
  'help.guide.instance-keys.result':
    '用户无需自己的密钥就能使用这些功能；没有 Google 密钥时，TREK 通过免费的 OpenStreetMap 组件和 TREK Places API 搜索。',
  'help.guide.instance-keys.tip.1': '用户在“设置”里的个人密钥对该用户来说优先于实例密钥。',
  'help.guide.instance-keys.tip.2': '密钥也可以来自环境变量；那些在这里显示为只读。',
  // places-transit
  'help.guide.places-transit.title': '选择搜索和公共交通数据源',
  'help.guide.places-transit.goal': '决定由谁响应地点搜索和公共交通路线。',
  'help.guide.places-transit.step.1':
    '在“地点搜索源”下选择“自动”“Google Places”“高德地图”或“OpenStreetMap”。“自动”使用现有的最佳密钥。',
  'help.guide.places-transit.step.2':
    '在“公共交通数据源”下选择“Transitous（免费）”，全球可用且无需密钥，或者“Google”，需要 Google 密钥。',
  'help.guide.places-transit.result': 'TREK 里的每个搜索框和每条公共交通路线都遵循这个选择。',
  'help.guide.places-transit.tip.1': '缺少密钥的数据源会在这里显示警告，并回退到 OpenStreetMap。',
  'help.guide.places-transit.tip.2': 'Google 的公共交通路线按请求计费；Transitous 不计费。',
  // file-types
  'help.guide.file-types.title': '限制文件类型',
  'help.guide.file-types.goal': '决定上传允许哪些文件扩展名。',
  'help.guide.file-types.step.1': '在“允许的文件类型”下编辑以逗号分隔的扩展名列表并保存。',
  'help.guide.file-types.result': '其他类型的上传会被明确的提示拒绝，无论是在文档、旅程还是封面里。',
  'help.guide.file-types.tip.1': '把图片类型留在列表里；封面和旅程照片走的是同一道检查。',
  // toggle-addon
  'help.guide.toggle-addon.title': '开启或关闭扩展',
  'help.guide.toggle-addon.goal': '把一个功能模块提供给所有人，或者收回。',
  'help.guide.toggle-addon.step.1': '拨动扩展卡片上的开关。导航项对所有人同时出现或消失。',
  'help.guide.toggle-addon.step.2':
    '有些卡片带有选项子行，比如“列表”下的“行李追踪”或“旅程”下的照片提供商；它们只在扩展开启时显示。',
  'help.guide.toggle-addon.result': '关闭的扩展的数据会保留；重新开启后再次显示。',
  'help.guide.toggle-addon.tip.1': '关闭 MCP 会移除端点以及依赖它的“集成”部分。',
  'help.guide.toggle-addon.tip.2': 'Vacay、Atlas 和旅程是用户要得最多的扩展；文档需要存储来放上传文件。',
  // install-plugin
  'help.guide.install-plugin.title': '安装插件',
  'help.guide.install-plugin.goal': '添加一个第三方插件，并只给它申请的权限。',
  'help.guide.install-plugin.step.1':
    '打开“发现”，选一个插件并点击“安装”；或者点击“上传插件”，选择一个 .zip 或 .tar.gz 包。',
  'help.guide.install-plugin.step.2':
    '回到“已安装”，阅读该行：插件可以读写什么、它调用哪些主机，以及是否已签名。打开“启用插件”。',
  'help.guide.install-plugin.step.3':
    '该行的菜单提供“重启”“查看错误日志”“允许的主机”和“更换版本…”；“删除”卸载它。有新版本时该行会提供更新，申请新权限的更新在你批准之前保持关闭。',
  'help.guide.install-plugin.result':
    '插件在自己的进程里运行；它添加的内容，如小组件、地图图层、工具，出现在插件声明的位置。',
  'help.guide.install-plugin.tip.1': '“重新扫描”不需要包，直接拾取为开发而链接的插件文件夹。',
  'help.guide.install-plugin.tip.2': '未签名的插件会被这样标出；只在你信任其来源时才安装。',
  // storage-backends
  'help.guide.storage-backends.title': '把上传文件迁到 S3 或镜像',
  'help.guide.storage-backends.goal': '把文件放在对象存储上，或者同时放在磁盘和存储桶上。',
  'help.guide.storage-backends.step.1':
    '在“后端”下点击“添加后端”，起个“名称”，选择“类型”：“本地”“S3”或“镜像”，填好字段并“应用”。“测试”检查连接，“保存更改”写入配置。',
  'help.guide.storage-backends.step.2':
    '在“分类”下把每个上传分类指派给一个后端。改动某一类时会询问是“移动现有对象”还是“仅路由新写入”。',
  'help.guide.storage-backends.step.3': '顶部的“健康状态”检查每个后端；红色条目会指出失败的是什么。',
  'help.guide.storage-backends.result': '新的上传进入指派的后端；已迁移的文件从那里提供。',
  'help.guide.storage-backends.tip.1': '通过环境变量配置的后端会显示出来，但不能在这里编辑。',
  'help.guide.storage-backends.tip.2': '镜像写入两个目标，从第一个读取；用它可以不停机地迁移。',
  // channels-instance
  'help.guide.channels-instance.title': '配置通知渠道',
  'help.guide.channels-instance.goal': '决定用户可以选哪些渠道，并设置邮件。',
  'help.guide.channels-instance.step.1':
    '在“电子邮件（SMTP）”下输入 SMTP Host、SMTP Port、SMTP User、SMTP Password 和 From Address；“发送测试邮件”会给你发一封邮件。',
  'help.guide.channels-instance.step.2':
    '打开“Web 推送”“Ntfy”和“Webhook”以提供它们；用户随后在“设置”的“通知”里为每台设备开启推送，或输入自己的主题或 URL。',
  'help.guide.channels-instance.step.3': '“行程提醒”开关行程开始前的提醒；“应用内通知”始终开启，这里只是说明。',
  'help.guide.channels-instance.result': '每个用户的“通知”标签页会显示你开启的渠道。',
  'help.guide.channels-instance.tip.1': '在这里输入的默认 ntfy 服务器会为用户预填；他们仍然可以指定自己的。',
  'help.guide.channels-instance.tip.2': '一旦具备该能力的插件被激活，插件渠道会自行出现。',
  // admin-channels
  'help.guide.admin-channels.title': '在手机上接收管理员事件',
  'help.guide.admin-channels.goal': '得知备份失败、新版本发布和其他实例事件。',
  'help.guide.admin-channels.step.1':
    '在“管理员 Ntfy”下输入一个主题，如有需要再填服务器和令牌；在“管理员 Webhook”下输入一个 URL。',
  'help.guide.admin-channels.step.2': '点击“发送测试 Ntfy”或“发送测试 Webhook”，看消息是否到达。',
  'help.guide.admin-channels.result': '管理员事件除了发到每位管理员的应用内铃铛之外，也会发到那里。',
  'help.guide.admin-channels.tip.1': '把管理员主题和你的个人主题分开，这样故障通知不会淹没在行程消息里。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': '撤销 AI 访问',
  'help.guide.mcp-tokens-admin.goal': '查看并切断任何用户的 AI 客户端持有的每个令牌和会话。',
  'help.guide.mcp-tokens-admin.step.1': '在“API 令牌”下按用户和名称找到令牌；垃圾桶删除它，客户端立即停止。',
  'help.guide.mcp-tokens-admin.step.2':
    '在“OAuth 会话”下对基于浏览器的客户端做同样的事：客户端、用户和日期，垃圾桶撤销会话。',
  'help.guide.mcp-tokens-admin.result': '客户端必须由它的用户重新连接；其他一切不变。',
  'help.guide.mcp-tokens-admin.tip.1': '范围告诉你客户端能做什么；只读范围留着无妨。',
  'help.guide.mcp-tokens-admin.tip.2': '关闭 MCP 扩展会一次撤销所有内容。',
  // release-history
  'help.guide.release-history.title': '检查新版本',
  'help.guide.release-history.goal': '知道你的 TREK 是否最新，以及下一个版本带来什么。',
  'help.guide.release-history.step.1':
    '有更新的版本时，管理页面顶部会显示“有可用更新”；“在 GitHub 查看”打开它，“如何更新”说明 Docker 和其他安装方式的更新步骤。',
  'help.guide.release-history.step.2':
    '“版本历史”列出每个版本及其说明；“显示详情”展开它们，最新的一个带“最新”，“加载更多”继续往回翻。',
  'help.guide.release-history.result': '更新在主机上进行，拉取新镜像或构建新标签；数据目录保持不变。',
  'help.guide.release-history.tip.1': '更新前先做备份；“备份”标签页就在隔壁。',
  'help.guide.release-history.tip.2': '预发布版本会显示，但除非你正在运行一个预发布版本，否则不会作为更新通告。',
  // create-backup
  'help.guide.create-backup.title': '创建并恢复备份',
  'help.guide.create-backup.goal': '给整个实例做快照，在别处留一份副本，并且能够放回去。',
  'help.guide.create-backup.step.1': '在“数据备份”下点击“创建备份”。它把数据库和上传文件打包成服务器上的一个文件。',
  'help.guide.create-backup.step.2': '“下载”把副本保存到这台机器之外；垃圾桶删除旧备份以释放空间。',
  'help.guide.create-backup.step.3': '对某个备份点“恢复”，或用文件“上传备份”，在“恢复备份？”确认一次后替换当前数据。',
  'help.guide.create-backup.result': '恢复会把用户、行程、文件和设置带回到那个备份的时刻；所有人都会被登出。',
  'help.guide.create-backup.tip.1': '恢复是这里唯一无法撤销的操作。先做一个新的备份。',
  'help.guide.create-backup.tip.2': '备份存放在数据目录里；只有放到另一台机器上的副本才算真正的备份。',
  // auto-backup
  'help.guide.auto-backup.title': '定时备份',
  'help.guide.auto-backup.goal': '让服务器自行备份，并只保留最近几个。',
  'help.guide.auto-backup.step.1':
    '在“自动备份”下打开“启用自动备份”，选择“间隔”“执行时间”，以及每周或每月时的“星期几”或“每月几号”。',
  'help.guide.auto-backup.step.2': '“自动删除旧备份”设置备份保留多久；新备份生成时，更旧的会被删除。',
  'help.guide.auto-backup.result': '备份按计划出现在列表里；失败会发到管理员渠道。',
  'help.guide.auto-backup.tip.1': '时间遵循服务器的时区，显示在“审计”标签页里。',
  'help.guide.auto-backup.tip.2': '服务器上的存储是有限的；保留三到五个通常就够了。',
  // audit-log
  'help.guide.audit-log.title': '阅读审计日志',
  'help.guide.audit-log.goal': '弄清谁在什么时候做了什么。',
  'help.guide.audit-log.step.1':
    '阅读各行：时间、用户、操作、资源、IP 和详情，最新的在前。操作按发生的事情命名，比如登录失败、MFA 变更或恢复。',
  'help.guide.audit-log.step.2': '“刷新”重新加载顶部；“加载更多”继续往回翻。',
  'help.guide.audit-log.result': '一份可以交给任何询问为什么有变动的人的记录。',
  'help.guide.audit-log.tip.1': '时间以服务器的时区显示，时区名称在表格上方。',
  'help.guide.audit-log.tip.2': '日志只增不改；这里的任何内容都不能从应用里编辑或删除。',
  // document-providers
  'help.guide.document-providers.title': '提供一个文档存储',
  'help.guide.document-providers.goal': '决定旅行可以让它的文档与哪些存储保持同步。',
  'help.guide.document-providers.step.1':
    '“文档”卡片在它的搁板上以行的形式列着各个存储：Paperless-ngx、Papra、Nextcloud、OpenCloud 和 Synology Drive。五个一开始都是关的，而且搁板只在“文档”本身开着时才在。',
  'help.guide.document-providers.step.2':
    '拨动 Nextcloud 那一行的开关。提示写着“扩展已更新”，从此旅行所有者会在他们旅行的“文件”标签页里看到“文档同步”，Nextcloud 列在“连接文档服务”下。',
  'help.guide.document-providers.result':
    '这个存储在这台 TREK 的每个旅行上都可供使用；在旅行所有者去连接之前，什么都没有连上。',
  'help.guide.document-providers.tip.1':
    '这里只决定一个存储是否可以提供。地址和凭据属于某个旅行，由旅行的所有者在它的“文件”标签页里输入，绝不在管理面板里。',
  'help.guide.document-providers.tip.2':
    '关掉“文档”会连带关掉每个存储，而“文档”关着时也开不了任何存储：服务器会回答“Enable the Documents addon first”。你自己网络里的存储还需要服务器上设置 ALLOW_INTERNAL_NETWORK=true。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '一次旅行的全部：包含天数、地图和地点的计划，以及交通、预订、列表、费用、文件和协作的标签页。它们每一个都有自己的帮助页面，就在本页面下方。',
  'help.ctx.trip.bullet.1':
    '标签栏：“计划”“交通”“预订”“列表”“费用”“文件”和“协作”。哪些标签页存在，由你的 TREK 上的扩展和插件决定。',
  'help.ctx.trip.bullet.2':
    '“计划”是三栏：左边是天数，中间是地图，右边是地点。预订和交通就住在计划里，位于停靠点上和停靠点之间；标签页把它们列出来。',
  'help.ctx.trip.bullet.3': '右上角的“分享”打开旅行里的人：成员、访客、邀请链接和只读的公开链接。',
  'help.ctx.trip.bullet.4': '标题、日期、封面和货币在“我的旅行”里编辑，用旅行卡片上的铅笔。',
  'help.ctx.trip.bullet.5': '栏内侧边缘的折叠箭头把这一栏收起来，地图占据空间；栏旁边的细分隔线改变它的宽度。',
  'help.ctx.trip.bullet.6': '天数工具栏里的撤销箭头收回对计划的上一次更改。',
  // add-member
  'help.guide.add-member.title': '添加成员',
  'help.guide.add-member.goal': '让有 TREK 账户的人可以访问这次旅行。',
  'help.guide.add-member.step.1': '点击右上角的“分享”。',
  'help.guide.add-member.step.2': '在“邀请用户”下，从列表中选中此人并点击“邀请”。',
  'help.guide.add-member.step.3': '此人现在出现在“访问权限”下。皇冠标记所有者；行末的图标可再次移除访问权限。',
  'help.guide.add-member.result': '成员像你一样查看和编辑旅行，范围在管理员于“权限设置”下设定的级别之内。',
  'help.guide.add-member.tip.1': '列表里没有的人还没有 TREK 账户：把他们添加为访客，或者让他们通过邀请链接注册。',
  'help.guide.add-member.tip.2': '“访问权限”旁边的数字统计旅行里的人数；访客在下方单独列出。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '通过链接邀请',
  'help.guide.trip-invite-link.goal': '让别人自己加入旅行。',
  'help.guide.trip-invite-link.step.1': '点击“分享”，然后在“行程邀请链接”下点击“创建邀请链接”。',
  'help.guide.trip-invite-link.step.2': '点击“复制”并发送链接。任何有 TREK 账户的人打开它就会以成员身份加入。',
  'help.guide.trip-invite-link.step.3': '“重新生成”会替换链接并让旧链接失效；“停用”会关闭它。',
  'help.guide.trip-invite-link.result': '打开链接的人就在旅行里了，并显示在“访问权限”下。',
  'help.guide.trip-invite-link.tip.1':
    '没有账户的人用不了它。管理员在“管理后台”、“用户”下分发注册链接，并可以把其中一个绑定到这次旅行。',
  'help.guide.trip-invite-link.tip.2': '链接发错了聊天时就重新生成：旧链接立刻失效。',
  // add-guest
  'help.guide.add-guest.title': '添加没有账户的访客',
  'help.guide.add-guest.goal': '把一个不用 TREK 的人算进来。',
  'help.guide.add-guest.step.1': '点击“分享”并滚动到“访客”。',
  'help.guide.add-guest.step.2': '在“访客姓名”中输入名字，然后点击“添加访客”。',
  'help.guide.add-guest.result': '访客可以被分配到费用、行李物品和任务，但无法登录。',
  'help.guide.add-guest.tip.1': '铅笔可以给访客改名；行末的图标会把他们连同其分摊和分配一起移除。',
  'help.guide.add-guest.tip.2': '如果这个人后来有了账户，就把他们邀请为成员，并移除访客。',
  // public-link
  'help.guide.public-link.title': '发布只读链接',
  'help.guide.public-link.goal': '把旅行展示给不应编辑它的人。',
  'help.guide.public-link.step.1':
    '点击“分享”；在右侧的“公开链接”下，勾选链接可以显示的内容。“地图与计划”始终开启；“预订”“行李”“费用”和“聊天”由你决定。',
  'help.guide.public-link.step.2': '点击“创建链接”，然后点击“复制”。',
  'help.guide.public-link.step.3': '链接存在期间可以随时更改勾选；“删除链接”会让它停止。',
  'help.guide.public-link.result': '任何有链接的人无需登录就能看到所选部分，并且什么都改不了。',
  'help.guide.public-link.tip.1': '这个链接不会列在任何地方；谁拿到它都能打开，所以要像对待密码一样对待它。',
  'help.guide.public-link.tip.2': '要给编辑权限，就改为把此人添加为成员。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '移交旅行或退出旅行',
  'help.guide.transfer-ownership.goal': '让别人成为所有者，或者退出一次不属于你的旅行。',
  'help.guide.transfer-ownership.step.1': '点击“分享”。在“访问权限”下，成员行上的皇冠会让此人成为所有者；确认提问。',
  'help.guide.transfer-ownership.step.2': '你自己那一行上的“退出旅行”会把你带出旅行；作为所有者，请先移交。',
  'help.guide.transfer-ownership.result': '新所有者管理成员并可以删除旅行；你仍是普通成员。',
  'help.guide.transfer-ownership.tip.1': '在移交之前，所有者就是创建旅行的人；删除旅行只有所有者能做。',
  'help.guide.transfer-ownership.tip.2': '另一行上的“移除访问权限”是同一个按钮的反向操作：所有者把成员请出去。',
  // collapse-columns
  'help.guide.collapse-columns.title': '给地图腾出空间',
  'help.guide.collapse-columns.goal': '收起一栏，或者给它更多宽度。',
  'help.guide.collapse-columns.step.1':
    '点击天数栏内侧边缘的折叠箭头把它收起来；地图占据这块空间。地点栏有同样的箭头。',
  'help.guide.collapse-columns.step.2': '再次点击折叠箭头，把这一栏找回来。',
  'help.guide.collapse-columns.step.3': '拖动栏与地图之间的细分隔线来改变栏的宽度。',
  'help.guide.collapse-columns.result': '宽度会被记住；下次访问时各栏会恢复展开。',
  'help.guide.collapse-columns.tip.1': '两栏可以同时收起，得到只有地图的视图。',
  'help.guide.collapse-columns.tip.2': '手机上没有栏：“计划”和“地点”是地图底部的两个按钮。',
  // undo-change
  'help.guide.undo-change.title': '撤销上一次更改',
  'help.guide.undo-change.goal': '收回你刚刚对计划做的事。',
  'help.guide.undo-change.step.1': '点击天数上方工具栏里的撤销箭头；它的提示会写出将要收回的更改。',
  'help.guide.undo-change.result': '计划恢复原样，箭头变灰，直到下一次更改。',
  'help.guide.undo-change.tip.1': '撤销覆盖计划：分配、移除、重新排序和移动地点，优化路线，删除地点，类别更改和导入。',
  'help.guide.undo-change.tip.2': '它只有一步深：只能收回最新的一次更改，新的更改会取代它。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '地点',
  'help.ctx.trip-places.summary':
    '计划的右栏：旅行的每一个地点，无论是否已规划，带搜索和筛选，以及把地点带进来的各种方式：手动添加、从文件导入或从共享列表导入。',
  'help.ctx.trip-places.bullet.1':
    '顶部的“添加地点/活动”打开一个表单，用来输入或搜索地点。当某一天打开时，按钮变成“新地点”，旁边的“加入当天”直接把地点创建到那一天。',
  'help.ctx.trip-places.bullet.2':
    '“导入文件”接受 .gpx、.kml 和 .kmz 文件；“列表导入”接受共享的 Google Maps 或 Naver Maps 列表。文件也可以直接拖放到这一栏上。',
  'help.ctx.trip-places.bullet.3':
    '下拉菜单在“全部”“未规划”“已规划”之间切换，导入轨迹之后还会有“路线”；它下方是搜索框、分类筛选和用于最低评分的星标。',
  'help.ctx.trip-places.bullet.4':
    '一行显示图片、名称以及描述或地址。点击它查看地点详情，把它拖到某一天，或者右键点击它，得到“编辑”“+ 天”“打开网站”“Google 地图”“保存到收藏”和“删除”。',
  'help.ctx.trip-places.bullet.5':
    '在某一天打开时，未规划行末尾的 + 会把地点放到那一天，而“已规划”只列出那一天，旁边的“显示整个行程”可以再次放宽。',
  'help.ctx.trip-places.bullet.6': '筛选行右端的对勾开始一次选择：多行一次性获得新分类、进入某个收藏或被删除。',
  // create-place
  'help.guide.create-place.title': '创建地点',
  'help.guide.create-place.goal': '手动添加一个地点或活动，连同计划需要知道的一切。',
  'help.guide.create-place.step.1': '点击地点栏顶部的“添加地点/活动”（某一天打开时是“新地点”）。表单打开。',
  'help.guide.create-place.step.2':
    '在顶部的“搜索地点...”里输入地点并选一个结果。“名称”“地址”“纬度”“经度”和“网站”会自动填好，左侧的“地点详情”显示图片、营业时间和一段描述。在配了 Google 密钥的 TREK 上，“不是想找的地点？改用 Google 搜索”就在结果列表下方，它用 Google 跑同一个搜索。',
  'help.guide.create-place.step.3':
    '在“地点详情”里，点击“选择图片”下方的一张图片就把它设为地点的配图；“使用此文本”把描述接过来填入表单。',
  'help.guide.create-place.step.4':
    '检查各个字段：“名称”必填；“描述”和“备注”由你自己写；“地址”“纬度”和“经度”来自搜索或手动输入；“分类”从旅行的分类里选一个，旁边的 + 可以当场新建一个；“网站”放链接。',
  'help.guide.create-place.step.5': '点击“添加”。如果旅行里已经有同名的地点，表单会说明，按钮变成“仍然添加”。',
  'help.guide.create-place.result': '地点已经在列表里和地图上，在被放到某一天之前位于“未规划”下。',
  'help.guide.create-place.tip.1':
    '表单底部的“文件”和“费用”可以给地点附上一份文档，或者在保存之后立刻打开它那笔支出的“费用”编辑器。',
  'help.guide.create-place.tip.2':
    '每个 TREK 上回答搜索的都是 TREK 索引和 OpenStreetMap，“地点详情”则自己从 Wikipedia、Wikivoyage 和 Wikimedia 取内容。只有在这两者都查不到时才会去问 Google，而且只有 Google 会带来评分。',
  'help.guide.create-place.tip.3': '地点也可以从地图开始：右键点击那个位置，表单就会带着坐标和地址打开。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '把地点直接加到打开的那一天',
  'help.guide.place-to-open-day.goal': '跳过第二步：创建或选中地点，一次就把它放到那一天。',
  'help.guide.place-to-open-day.step.1':
    '在天数栏里点击某一天的标题。这一天就打开了：它的卡片高亮，地点栏多出“加入当天”按钮。',
  'help.guide.place-to-open-day.step.2':
    '“加入当天”打开的表单和“新地点”一样，只是你点击“添加”的那一刻地点就落在打开的那一天上。',
  'help.guide.place-to-open-day.step.3': '已经存在的地点，用它那一行末尾的 + 或者右键点击后的“+ 天”放到打开的那一天。',
  'help.guide.place-to-open-day.step.4':
    '反过来也行，而且不用先打开某一天：把地点的那一行拖出列表，放到某天的卡片上。放在两个停靠点之间，它就正好落在那里。',
  'help.guide.place-to-open-day.result': '地点列在那一天下面，排在最后；上下拖动把它放到该在的位置。',
  'help.guide.place-to-open-day.tip.1':
    '打开的那一天也会影响搜索：有一天处于打开状态时，地图和附近搜索都从这一天本来要去的地方开始。',
  'help.guide.place-to-open-day.tip.2': '天数上方工具栏里的“撤销”收回这次分配。',
  // filter-places
  'help.guide.filter-places.title': '在列表里找到地点',
  'help.guide.filter-places.goal': '把这一栏收窄到你要找的地点。',
  'help.guide.filter-places.step.1':
    '顶部的下拉菜单在“全部”、“未规划”（还不在任何一天上）、“已规划”（在某一天上）和“路线”（导入的 GPX 轨迹）之间切换，每一项都带数量。',
  'help.guide.filter-places.step.2': '在“搜索地点...”里输入；列表随着输入不断收窄。',
  'help.guide.filter-places.step.3':
    '“所有分类”打开一个列表，可以勾选一个或多个分类，“无分类”也在其中；底部的“清除筛选”把它重置。',
  'help.guide.filter-places.step.4': '旁边的星标设定最低评分：5+、4+ 等等，只显示你打分不低于该值的地点。',
  'help.guide.filter-places.result': '行上方的数字说明有多少地点符合；各个筛选条件会叠加。',
  'help.guide.filter-places.tip.1':
    '某一天打开时，“已规划”只列出那一天并会说明：“仅显示当前打开的日期”，旁边是“显示整个行程”。',
  'help.guide.filter-places.tip.2': '地图同样收窄到打开的那一天；列表里的“全部”仍然显示旅行的每一个地点。',
  // edit-place
  'help.guide.edit-place.title': '修改地点',
  'help.guide.edit-place.goal': '改个名字、挪一下图钉、加上网站或者换个分类。',
  'help.guide.edit-place.step.1': '右键点击该行并选择“编辑”，或者打开地点并在它的详情里点击“编辑”。',
  'help.guide.edit-place.step.2':
    '改你需要的：“名称”“描述”“备注”“地址”“纬度”和“经度”“分类”“网站”。从某一天打开时，表单里还有“当天备注”以及那一天的“开始”和“结束”。',
  'help.guide.edit-place.step.3': '点击“更新”。',
  'help.guide.edit-place.result': '改动在地点出现的所有地方生效：列表、地图和它所在的每一天。',
  'help.guide.edit-place.tip.1': '“当天备注”属于这个地点在那一天上的条目；“备注”属于地点本身。',
  'help.guide.edit-place.tip.2': '“结束”早于“开始”会挡住“更新”；“时间冲突：”只是提醒当天另有一个停靠点用了相同的时间。',
  // delete-place
  'help.guide.delete-place.title': '删除地点',
  'help.guide.delete-place.goal': '把一个地点彻底移出旅行。',
  'help.guide.delete-place.step.1': '右键点击该行并选择“删除”，或者在地点详情里点击“删除”。',
  'help.guide.delete-place.step.2':
    '确认。如果这个地点上订了一晚住宿，或者有预订与它相关，提示会说明会一并消失的内容。',
  'help.guide.delete-place.result': '地点从列表、地图和每一天都消失了；天数上方工具栏里的“撤销”能把它找回来。',
  'help.guide.delete-place.tip.1': '只想把地点从某一天上拿掉，就改在那个停靠点上用“从当天移除”。',
  'help.guide.delete-place.tip.2': '一次处理多个地点：筛选旁边的对勾开始一次选择。',
  // select-places
  'help.guide.select-places.title': '一次修改或删除多个地点',
  'help.guide.select-places.goal': '一次性整理列表，而不是一个一个来。',
  'help.guide.select-places.step.1': '点击筛选行右端的对勾。各行出现复选框，并出现一条带有各项操作的操作栏。',
  'help.guide.select-places.step.2': '勾选各行，或者用操作栏上的“全选”；操作栏会统计选中的数量。',
  'help.guide.select-places.step.3':
    '“更改分类”给它们全部同一个分类；“保存到收藏”把它们复制到你的某个收藏里；“删除所选”在确认之后把它们移除。',
  'help.guide.select-places.step.4': '再次点击对勾即可退出选择。',
  'help.guide.select-places.result': '改动作用于每一个选中的地点；删除可以从天数上方的工具栏撤销。',
  'help.guide.select-places.tip.1': '选择期间筛选仍然有效：先筛到“未规划”，再用“全选”就正好抓到那些。',
  'help.guide.select-places.tip.2':
    '收藏扩展开启时，操作栏上会出现“在清单中标记为已去过”：它会在这些地点所保存的收藏里把它们勾掉。',
  // import-places-file
  'help.guide.import-places-file.title': '从 GPX、KML 或 KMZ 文件导入地点',
  'help.guide.import-places-file.goal': '把 Google My Maps、Google Earth 或 GPS 记录器导出的内容带进来。',
  'help.guide.import-places-file.step.1': '点击“导入文件”，或者把文件拖放到地点栏的任意位置。',
  'help.guide.import-places-file.step.2':
    '选择文件或把它拖进方框。对于 GPX，勾选要导入的内容：“路点”“路线”“轨迹（含路径几何）”；对于 KML 和 KMZ，是“点（Placemarks）”和“路径（LineStrings）”。',
  'help.guide.import-places-file.step.3':
    '方框一次可以接收多个文件，而且只接收 .gpx、.kml 和 .kmz。其他类型的文件，或者超过 10 MB 的文件，会在对话框里被拒绝，不会导入。',
  'help.guide.import-places-file.step.4':
    '点击“导入”。会有一条消息说明进来了多少地点；如果是 KML 或 KMZ 文件，对话框会继续开着，并给出创建了什么、跳过了什么的摘要。',
  'help.guide.import-places-file.result':
    '地点已经在列表里；轨迹的行上带有路线标记，会画在地图上，并获得自己的“路线”筛选项。',
  'help.guide.import-places-file.tip.1': '文件过大会被拒绝并给出大小上限；去掉照片重新导出，或者把它拆开。',
  'help.guide.import-places-file.tip.2': '整次导入可以从天数上方的工具栏撤销。',
  // import-places-list
  'help.guide.import-places-list.title': '导入共享的 Google Maps 或 Naver Maps 列表',
  'help.guide.import-places-list.goal': '把共享列表的链接变成地点。',
  'help.guide.import-places-list.step.1': '点击“列表导入”并选择“Google 列表”或“Naver 列表”。',
  'help.guide.import-places-list.step.2':
    '粘贴该列表的共享链接。Google Maps 的路线规划链接也可以：它的各个停靠点会按驾车顺序变成地点。',
  'help.guide.import-places-list.step.3': '点击“导入”。',
  'help.guide.import-places-list.result': '列表里的每个地点都进了旅行，名称与列表中一致；旅行里已有的地点会被跳过。',
  'help.guide.import-places-list.tip.1': '列表必须公开共享；私有列表的链接什么也导不进来。',
  'help.guide.import-places-list.tip.2':
    '当你的 TREK 配有 Google 密钥时，对话框里会出现“通过 Google 丰富地点信息”：它会逐个查找导入的地点，补上照片、地址和详情。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '天',
  'help.ctx.trip-days.summary':
    '计划的左栏：每天一张卡片，上面是按顺序排列的停留点、备注、当天的预订和交通，以及停留点之间的路线。行程真正被规划的地方就在这里。',
  'help.ctx.trip-days.bullet.1':
    '顶部的工具栏：“导出”（PDF、日历、GPX）、“展开所有日期”/“折叠所有日期”、撤销箭头、“调整日期顺序”和“显示所有预订路线”。',
  'help.ctx.trip-days.bullet.2':
    '一张日期卡片：标题栏里有天数、天气、标题、日期和当天的费用；点击标题栏打开这一天，它的折叠箭头把卡片收起来。“公共交通”“添加交通”和“添加备注”也在标题栏里。',
  'help.ctx.trip-days.bullet.3':
    '一天内部：按顺序排列的停留点，每个都有图片、名称、时间和图片上的锁；备注；属于这一天的预订；以及停留点之间每一段的行程时间。',
  'help.ctx.trip-days.bullet.4':
    '停留点下方是路线栏：“路线”把这一天画在地图上，“优化”给停留点排序，“驾车”/“步行”设定当天的出行方式，“在 Google Maps 中打开”和“在 CoMaps 中打开”把这一天交出去。',
  'help.ctx.trip-days.bullet.5':
    '地点进入某一天的方式：从地点栏拖一行过来、用该行上的 +、在空的一天用“添加地点到这一天”，或者从地点详情里。',
  'help.ctx.trip-days.bullet.6': '底部的“总费用”把每一个带价格的停留点和预订按行程的货币加起来。',
  // read-day-plan
  'help.guide.read-day-plan.title': '读懂一天',
  'help.guide.read-day-plan.goal': '在动手改动之前，先知道日期卡片的每一部分在告诉你什么。',
  'help.guide.read-day-plan.step.1':
    '标题栏：天数、当天的天气预报、“第 1 天”或你给它起的标题、日期和当天的费用。点击标题栏打开这一天（它的“日程详情”面板在地图上方打开）；右侧的折叠箭头把卡片收起或展开。',
  'help.guide.read-day-plan.step.2':
    '一个停留点：左边的握柄用来拖动，图片上带着用于路线优化的锁，接着是名称、描述，以及设置过的话，“当天备注”。停留点有时间时会显示一个标出“开始”和“结束”的时间标签；它右端出现的箭头把它上移或下移。',
  'help.guide.read-day-plan.step.3':
    '当天的预订：绑在某个停留点上的预订会把这个停留点标为“预订已确认”或“预订待确认”；交通显示为“出发”或“到达”，带时间和路线，旁边一个小开关把那条路线画在地图上。',
  'help.guide.read-day-plan.step.4':
    '两个停留点之间的连接线按当天的出行方式说明这一段要多久、有多远；点击它就能只改这一段的方式。',
  'help.guide.read-day-plan.step.5':
    '末尾的路线栏：“路线”把这一天的路画在地图上，“优化”重排停留点，方式按钮选择“驾车”或“步行”，“在 Google Maps 中打开”和“在 CoMaps 中打开”把这一天在那里打开。',
  'help.guide.read-day-plan.result': '卡片上的每个符号都有含义；下面的指南会逐个改动它们。',
  'help.guide.read-day-plan.tip.1':
    '右键点击一个停留点打开它的菜单：“编辑”“从当天移除”“打开网站”、导航应用（Google Maps、Waze、Apple Maps、OpenStreetMap、CoMaps）、“保存到收藏”“删除”。',
  'help.guide.read-day-plan.tip.2':
    '把鼠标停在一个停留点上，末尾会出现“添加预订”：在那里创建的预订就绑在这一天的这个停留点上。',
  // place-onto-day
  'help.guide.place-onto-day.title': '把地点放到某一天',
  'help.guide.place-onto-day.goal': '把列表里的地点变成某一天的停留点，放在顺序中它该在的位置。',
  'help.guide.place-onto-day.step.1':
    '从地点栏把一行拖到日期卡片上。放在两个停留点之间就正好插在那里，放在卡片的任意位置则追加到末尾。',
  'help.guide.place-onto-day.step.2':
    '不用拖动：点击标题栏打开这一天，然后点击地点行末尾的 +，或者右键点击该行并选择“+ 天”。',
  'help.guide.place-onto-day.step.3': '在空的一天，“添加地点到这一天”打开地点表单，新地点立刻落在这一天上。',
  'help.guide.place-onto-day.step.4':
    '在地点详情里，“添加到当天”会问放到哪一天；某一天打开时，地点栏里的“加入当天”直接在打开的那一天创建一个新地点。',
  'help.guide.place-onto-day.result': '这个地点成了当天的停留点，在地图上带着这一天的编号，地点栏把它算在“已规划”下。',
  'help.guide.place-onto-day.tip.1':
    '一个地点可以在多天上：第二天还是从地点栏放过去。把停留点从一张日期卡片拖到另一张，则是移动它。',
  'help.guide.place-onto-day.tip.2': '工具栏里的撤销箭头可以收回这次分配。',
  'help.guide.place-onto-day.tip.3':
    '停留点不能放在两个有固定时间的条目之间，也不能放在已经定了时间的预订之前；计划会保持时间顺序。',
  // reorder-stops
  'help.guide.reorder-stops.title': '改变一天的顺序',
  'help.guide.reorder-stops.goal': '把停留点上移、下移，或者挪到另一天。',
  'help.guide.reorder-stops.step.1': '抓住停留点的握柄，把它拖到卡片里的新位置。',
  'help.guide.reorder-stops.step.2': '或者用停留点右端的箭头：每点一次上移或下移一格。',
  'help.guide.reorder-stops.step.3': '把停留点拖到另一张日期卡片上就移到那一天，它会离开原来的一天。',
  'help.guide.reorder-stops.step.4':
    '移动一个有固定时间的停留点时，如果这次移动会打乱当天的顺序，就会问“移除时间？”，因为决定它位置的正是这个时间：“确认”丢掉时间，让它可以去任何位置。',
  'help.guide.reorder-stops.result': '路线和行程时间立刻跟着新的顺序。',
  'help.guide.reorder-stops.tip.1': '有固定时间的预订无法重新排序；它们停在时间给它们的位置上。',
  'help.guide.reorder-stops.tip.2': '路线栏里的“优化”按最短路径给一整天排序；想让某个停留点留在原处，先给它上锁。',
  // set-stop-times
  'help.guide.set-stop-times.title': '给停留点一个时间',
  'help.guide.set-stop-times.goal': '定下停留点什么时候开始、什么时候结束，让这一天读起来像一份时间表。',
  'help.guide.set-stop-times.step.1': '右键点击停留点并选择“编辑”。从这一天打开时，表单底部有“开始”和“结束”。',
  'help.guide.set-stop-times.step.2':
    '填写“开始”，需要的话再填“结束”。“时间冲突：”会提示当天另一个有时间的停留点与它重叠；早于“开始”的“结束”会挡住“更新”。',
  'help.guide.set-stop-times.step.3': '点击“更新”。停留点得到一个时间标签，并移到这一天里它的时间所属的位置。',
  'help.guide.set-stop-times.result': '有时间的停留点保住它们在顺序中的位置；没有时间的停留点围着它们排列。',
  'help.guide.set-stop-times.tip.1': '时间属于那一天的那个停留点；同一个地点在另一天可以有另一个时间。',
  'help.guide.set-stop-times.tip.2':
    '要手动移动一个有时间的停留点，就拖它：只要你点“确认”，“移除时间？”这个问题就会在途中丢掉时间。',
  'help.guide.set-stop-times.tip.3':
    '同一个表单里的“当天备注”装的是只适用于这一天的内容，比如订好的一张桌子、一个票号。',
  // remove-from-day
  'help.guide.remove-from-day.title': '把停留点从某一天拿掉',
  'help.guide.remove-from-day.goal': '取消一个地点的规划，但不把它从行程里删掉。',
  'help.guide.remove-from-day.step.1': '右键点击停留点并选择“从当天移除”。',
  'help.guide.remove-from-day.step.2':
    '停留点从这一天消失；地点留在地点栏里，如果它不在任何其他天上，就在“未规划”之下。',
  'help.guide.remove-from-day.result': '这一天、它的路线和费用都会更新；撤销箭头把停留点找回来。',
  'help.guide.remove-from-day.tip.1': '同一个菜单里的“删除”会把这个地点从整趟行程里移除，包括每一天。',
  'help.guide.remove-from-day.tip.2': '“从当天移除”也在地点的详情面板里，就在“添加到当天”旁边。',
  // lock-stop
  'help.guide.lock-stop.title': '把停留点锁在原位',
  'help.guide.lock-stop.goal': '在优化路线时让停留点留在它现在的位置。',
  'help.guide.lock-stop.step.1': '把鼠标停在停留点的图片上并点击那把锁：“路线优化时保持位置”。',
  'help.guide.lock-stop.step.2': '现在“优化”会围着它给其他停留点排序；再点一次锁（“点击解锁”）就放开它。',
  'help.guide.lock-stop.result': '锁会显示在图片上；在你解锁之前，停留点保持它的位置。',
  'help.guide.lock-stop.tip.1': '有固定时间的停留点被它的时间锁住；它在优化中绝不会移动。',
  'help.guide.lock-stop.tip.2':
    '锁只在这次访问期间有效：重新加载之后每个停留点又都自由了，只有有时间的停留点仍然固定。',
  // day-note
  'help.guide.day-note.title': '给一天加一条备注',
  'help.guide.day-note.goal': '把一个提醒、一个票号或者一个备用方案直接放在这一天里。',
  'help.guide.day-note.step.1': '在这一天的标题栏点击“添加备注”。',
  'help.guide.day-note.step.2':
    '在“备注”里给它起个名字，日期卡片上显示的就是它，其余的写在“每日备注”里。上方的“格式”工具栏负责排版（“加粗”“项目符号列表”“编号列表”“链接”“引用”），左边的“预览”显示它将变成的卡片。',
  'help.guide.day-note.step.3': '挑一个“图标”和一种“颜色”，让备注从停留点中间显出来，然后“添加”。',
  'help.guide.day-note.step.4': '备注像停留点一样待在这一天里：拖动它到合适的位置，右键点击它得到“编辑”和“删除”。',
  'help.guide.day-note.result': '备注是这一天的一部分，PDF 里也有；带时间的备注会和有时间的停留点一起排序。',
  'help.guide.day-note.tip.1': '带时间的备注可以顶替一趟你没有预订的交通：“08:15 从中央车站坐 S3”。',
  'help.guide.day-note.tip.2': '备注是按天的；面向整趟行程的备注属于“协作”。',
  // day-route
  'help.guide.day-route.title': '显示并优化当天的路线',
  'help.guide.day-route.goal': '看清停留点之间的路，选择怎么出行，并让 TREK 来排顺序。',
  'help.guide.day-route.step.1':
    '打开这一天并点击路线栏里的“路线”：停留点之间的路画在地图上，停留点之间的连接线显示每一段的时间和距离。',
  'help.guide.day-route.step.2': '旁边的“驾车”和“步行”设定当天的出行方式；各段会重新计算。插件可以加进自己的出行方式。',
  'help.guide.day-route.step.3': '点击一条连接线来改这一段的方式：选一种方式，或者用“使用当日默认”退回当天的方式。',
  'help.guide.day-route.step.4':
    '“优化”按最短路径重排停留点。带锁或有固定时间的停留点保住它们的位置；当天有住宿时，路线从那里开始。',
  'help.guide.day-route.step.5':
    '“在 Google Maps 中打开”或“在 CoMaps 中打开”会把一整天作为一条路线在那个应用里打开，方便路上导航。',
  'help.guide.day-route.result': '这一天成了一条带时间的路线；顺序一变，“总费用”和各段就会更新。',
  'help.guide.day-route.tip.1': '路线默认来自 OSRM；管理员可以在“用户默认设置”里把 TREK 指向另一个路线引擎。',
  'help.guide.day-route.tip.2': '算不出路线的一段不显示时间；检查两个停留点是否都有坐标。',
  'help.guide.day-route.tip.3': '撤销箭头可以收回一次优化。',
  // manage-days
  'help.guide.manage-days.title': '添加、重排和重命名日期',
  'help.guide.manage-days.goal': '塑造日期本身，而不只是日期上的内容。',
  'help.guide.manage-days.step.1':
    '日期来自行程的日期范围；在“仪表盘”的行程卡片上改日期，两端就会增加或减少天数。在删掉有内容的日期之前，会有一个列表说明哪些日期会被去掉、上面有什么。',
  'help.guide.manage-days.step.2':
    '工具栏里的“调整日期顺序”打开一个列表：“上移”和“下移”连同这一天上的一切一起挪动，旁边的垃圾桶“删除这一天”会删掉它。列表下方，带有下一个日期的按钮会在最后一个有日期的天之后紧接着添加一天，并把行程延长一天；“无日期”在末尾追加一个没有日期的天。',
  'help.guide.manage-days.step.3':
    '“删除这一天”会先询问：列表显示会随这一天一起消失的内容，包括地点、笔记和预订、这天办理入住或退房的住宿，以及会提前一个日期的天。“删除这一天”会删掉它，“取消”则保留；最后一天不能删除。',
  'help.guide.manage-days.step.4':
    '要给一天改名，打开它，在地图上方的“日程详情”面板里点击标题旁边的铅笔；这个名字会在卡片里和 PDF 里代替“第 1 天”。',
  'help.guide.manage-days.step.5':
    '工具栏里的“展开所有日期”和“折叠所有日期”一次收起或展开所有卡片；单张卡片用它的折叠箭头收起。',
  'help.guide.manage-days.result': '日期跟着位置走：往上挪的一天拿到更早的日期，它的停留点、备注和预订都跟着一起走。',
  'help.guide.manage-days.tip.1': '移动日期可以从工具栏撤销，删除一天则不能。',
  'help.guide.manage-days.tip.2': '一天标题栏里的费用把这一天带价格的停留点和预订加起来。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '读懂计划里的预订和交通',
  'help.guide.bookings-in-plan.goal': '知道一份预订存在之后会出现在哪里，以及哪个界面创建它。',
  'help.guide.bookings-in-plan.step.1':
    '一趟交通（航班、火车、渡轮、公交车、汽车）在出发那天显示为“出发”，在到达那天显示为“到达”，带时间和路线；跨多天的会横跨中间的日子。',
  'help.guide.bookings-in-plan.step.2':
    '绑在某个停留点上的预订（餐厅、旅游团）会把那个停留点标为“预订已确认”或“预订待确认”；有日期但没有停留点的预订在这一天里自成一行。',
  'help.guide.bookings-in-plan.step.3':
    '在酒店过的一夜是住宿：它在当天的“日程详情”面板里“住宿”下面，从“入住”到“退房”，而这几天里每一天的路线都从那里开始。',
  'help.guide.bookings-in-plan.step.4':
    '在地图上，交通那一行上的开关会画出它的路线；工具栏里的“显示所有预订路线”把它们全都画出来。',
  'help.guide.bookings-in-plan.step.5':
    '创建的地方：停留点悬停时出现的“添加预订”、日期标题栏里的“添加交通”和“公共交通”，以及带导入和文件的完整列表“预订”和“交通”标签页。',
  'help.guide.bookings-in-plan.result': '一份预订，在计划里只有一个位置；标签页里是同样这些预订，只是列成了表。',
  'help.guide.bookings-in-plan.tip.1':
    '“已确认”和“待确认”是你在预订上设定的状态；计划把它显示在停留点上，“预订”标签页两者都计入。',
  'help.guide.bookings-in-plan.tip.2': '有固定时间的交通无法拖动；请改到预订里去改它的时间。',
  // export-plan
  'help.guide.export-plan.title': '导出计划',
  'help.guide.export-plan.goal': '把计划作为文档、带进日历或放到 GPS 上随身带走。',
  'help.guide.export-plan.step.1': '点击日期上方工具栏里的“导出”。',
  'help.guide.export-plan.step.2':
    '“文档”：“PDF”打开每一天的打印视图，连同它的停留点、备注和预订；“每天分页”让每一天从新的一页开始，“保存为 PDF”把它下载下来。',
  'help.guide.export-plan.step.3':
    '“日历”：“下载 .ics”把预订存成一个日历文件；“订阅日历”给出一个链接，你的日历应用会自己刷新它。',
  'help.guide.export-plan.step.4':
    '“地图与 GPS · GPX”：“整趟行程”导出地点、每天的路线和轨迹；“仅地点”只导出图钉；“按天生成路线”每天一条路线，供离线地图和 GPS 设备使用。',
  'help.guide.export-plan.result': '文件会下载下来；行程里什么都不会变。',
  'help.guide.export-plan.tip.1': '单独一天可以从它的路线栏送到地图应用：“在 Google Maps 中打开”或“在 CoMaps 中打开”。',
  'help.guide.export-plan.tip.2': '“订阅日历”需要在你的设置里打开日历订阅；“仪表盘”里有相应的指南。',
  'help.guide.export-plan.tip.3': '导出属于读取：行程的每一位成员都可以做。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '地点详情',
  'help.ctx.trip-place.summary':
    '选中一个地点时在地图上打开的卡片：旅行关于它知道的一切、大家给它的星、它的图片和文件，以及把它放到打开的那一天、放进某个列表或交给地图应用的按钮。',
  'help.ctx.trip-place.bullet.1':
    '点击地点栏里的一行、某一天里的一个停靠点，或者地图上的一个标记，卡片就在地图上打开。在某一天里选中它，卡片就知道你指的是哪个停靠点，这也正是把该停靠点的参与者和它的预订一起带出来的原因。',
  'help.ctx.trip-place.bullet.2':
    '头部带着圆形图片、名称、分类、地址和坐标。点击图片可以换成你自己的，双击名称可以当场重命名地点，右边的 X 关闭卡片。',
  'help.ctx.trip-place.bullet.3':
    '下面是：有价格时的价格、每位旅行者给这个地点的星、描述和备注，以及停靠点带有备注时的“当天备注”。',
  'help.ctx.trip-place.bullet.4':
    '接着按适用情况显示“营业时间”“轨迹颜色”“轨迹数据”和“文件”。“文件”接收你文件夹里的任何东西，也会列出挂在这个停靠点预订上的文件。',
  'help.ctx.trip-place.bullet.5':
    '底部那一行：某一天打开时是“添加到当天”或“从当天移除”，然后是“保存到收藏”“导航”“打开网站”“编辑”和“删除”。',
  'help.ctx.trip-place.bullet.6':
    '从搜索里挑出来的地点带着 TREK 索引或 OpenStreetMap 对它的了解：图片周围绿色的“营业中”或红色的“已关闭”圆环，按地点自己的时钟判断；星星下方的电话号码；再往下的“营业时间”，那一行写着当天的时段，点一下展开整周；以及“打开网站”背后的网站。Google 的评分只在通过 Google 找到的地点上显示，且这台 TREK 要有 Google 密钥。',
  // read-place
  'help.guide.read-place.title': '卡片告诉你关于一个地点的什么',
  'help.guide.read-place.goal': '在一张卡片里读到旅行关于一个地点知道的一切。',
  'help.guide.read-place.step.1': '在天数栏里点击你想读的停靠点。卡片在地图上打开，该停靠点在它那一天里保持高亮。',
  'help.guide.read-place.step.2':
    '头部：圆形图片、名称、地址和精确坐标。图片周围带“营业中”的绿色圆环或带“已关闭”的红色圆环，说明这个地点此刻是否营业，按它自己的时钟判断，前提是 TREK 知道它的营业时间。右边的 X 再次关闭卡片。',
  'help.guide.read-place.step.3':
    '下面是每位旅行者给这个地点的星，带平均分和投票人数。还没有人评分时显示“暂无评分”。紧接着是电话号码，如果地点有的话：点一下就把号码交给你的电话应用。',
  'help.guide.read-place.step.4':
    '然后是描述，下面是备注。两者都是地点表单里的文本渲染后的样子：列表、链接和粗体都有效。',
  'help.guide.read-place.step.5': '“参与者”说明谁会去这个停靠点。在你把某人移出去之前，所有人都在。',
  'help.guide.read-place.step.6':
    '再往下是“营业时间”：那一行写着你正在看的那一天的时段，点一下展开整周，那一天以粗体显示。“文件”就在它旁边。',
  'help.guide.read-place.result':
    '卡片会一直开着，直到你用 X 关闭它或选中另一个地点，整周的营业时间保持展开，而它所属的停靠点在天数栏里保持高亮。',
  'help.guide.read-place.tip.1':
    '从地点栏选中时，卡片认得这个地点但不认得某个停靠点，所以不显示参与者也不显示预订。改在某一天里选中那个停靠点，两者就都在。',
  'help.guide.read-place.tip.2': '双击名称可以不打开表单就重命名地点。Enter 保存，Escape 放弃修改。',
  'help.guide.read-place.tip.3':
    '手动输入的地点不显示这些：卡片只知道它表单里的内容。用“编辑”打开它，在“搜索地点...”下方的建议里选中它，再点击“更新”，营业时间、电话号码和网站就会一起带进来。Google 的评分需要 Google 密钥。',
  // rate-place
  'help.guide.rate-place.title': '给一个地点评分',
  'help.guide.rate-place.goal': '给地点打上你自己的星，并看看别人都给了多少。',
  'help.guide.rate-place.step.1': '打开这个地点。星标行就在头部下面，带着到目前为止投票的平均分，括号里是票数。',
  'help.guide.rate-place.step.2': '点击你想给的那颗星。鼠标划过时星会依次点亮，所以你能看到自己将要给出多少。',
  'help.guide.rate-place.step.3':
    '你的一票立刻计入平均分，旁边的头像就是投过票的人。鼠标悬停在这一行上可以看到每个人给的星。',
  'help.guide.rate-place.step.4': '同一个平均分也在地点栏里该地点那一行上，所以好地点在列表里很显眼。',
  'help.guide.rate-place.result':
    '你的星留在地点上，整个旅行都看得到，而列表上方筛选行里的星标现在可以只保留达到某个下限的地点。',
  'help.guide.rate-place.tip.1': '每位旅行者都可以评分，即使在只有部分人可以“添加 / 编辑 / 删除地点”的旅行里也一样。',
  'help.guide.rate-place.tip.2': '点击你已经给过的那颗星就能收回你的一票。当没有人再投票时，地点又显示“暂无评分”。',
  'help.guide.rate-place.tip.3': '星标旁边最多能放下六位投票者的头像；提示会列出他们全部，并标出你的那一票。',
  // place-image
  'help.guide.place-image.title': '给地点放上你自己的图片',
  'help.guide.place-image.goal': '用你自己的照片替换自动的缩略图。',
  'help.guide.place-image.step.1': '从地点栏打开这个地点。',
  'help.guide.place-image.step.2':
    '鼠标悬停在头部的圆形图片上：出现一个相机，提示写着“上传图片”。点击它并选择你的文件。',
  'help.guide.place-image.step.3': '头部现在显示你的图片，角上有一个红色小 X。',
  'help.guide.place-image.step.4': '同一张图片也在地点栏里该地点那一行上，以及它在地图上的标记上。',
  'help.guide.place-image.result':
    '你的图片在所有地方都是这个地点的图片：卡片、地点栏、当天里的停靠点、地图上的标记，以及共享出去的旅行。',
  'help.guide.place-image.tip.1': 'JPG、PNG、GIF 和 WebP 都接收，来自 iPhone 的 HEIC 会在进来的路上转换。',
  'help.guide.place-image.tip.2': '角上的 X 会再次移除你的图片，自动图片就回来了。地点本身不受影响。',
  'help.guide.place-image.tip.3': '没有你自己的图片时，TREK 会根据地点的坐标去找一张，找不到就退回到分类的图标。',
  // place-day-assign
  'help.guide.place-day-assign.title': '把地点放到打开的那一天，或者移出来',
  'help.guide.place-day-assign.goal': '用卡片自己的按钮，而不是把行拖过整个规划器。',
  'help.guide.place-day-assign.step.1': '在天数栏里点击某一天的标题。那一天现在是打开的那天，卡片就针对它工作。',
  'help.guide.place-day-assign.step.2':
    '在地点栏里点击一个还不在那一天的地点。它的卡片打开，底部那一行给出“添加到当天”。',
  'help.guide.place-day-assign.step.3': '点击“添加到当天”。停靠点落在那一天的末尾，按钮变成“从当天移除”。',
  'help.guide.place-day-assign.step.4': '停靠点现在在那一天里，排在列表最后。把它往上拖到该在的位置。',
  'help.guide.place-day-assign.step.5': '“从当天移除”把那个停靠点再次从这一天拿掉，卡片又给出“添加到当天”。',
  'help.guide.place-day-assign.result': '这一天带着这个停靠点，或者不再带着它，而无论哪种情况地点本身都不受影响。',
  'help.guide.place-day-assign.tip.1': '这个按钮只在某一天打开时存在。没有打开的日子，卡片就没有地方可以把地点加进去。',
  'help.guide.place-day-assign.tip.2':
    '把停靠点从某一天拿掉，地点仍留在旅行里和地点栏里。“删除”才是把它从所有地方移除的操作。',
  'help.guide.place-day-assign.tip.3':
    '由住宿预订放到当天的停靠点两个按钮都没有：那一晚在当天的“住宿”区块里添加和移除。',
  // place-participants
  'help.guide.place-participants.title': '说明谁会去这个停靠点',
  'help.guide.place-participants.goal': '为一个停靠点把队伍分开，而不用把旅行分开。',
  'help.guide.place-participants.step.1': '点击某一天里的停靠点。卡片打开，“参与者”列出旅行里的所有人。',
  'help.guide.place-participants.step.2': '点击某位旅行者的名牌，把他移出这个停靠点。鼠标悬停时名字会加上删除线。',
  'help.guide.place-participants.step.3': '一旦有人缺席，就会出现一个虚线的 +。点击它可以看到谁不在这个停靠点上。',
  'help.guide.place-participants.step.4': '点击一个名字把他放回去。所有人都回来后，这个停靠点又属于整个队伍。',
  'help.guide.place-participants.result': '停靠点带着你选中的旅行者，队伍里的其他人那个下午可以自己安排。',
  'help.guide.place-participants.tip.1':
    '“参与者”只在选中了停靠点时才出现，所以请在某一天里选地点，而不是在地点栏里，而且只在旅行者不止一位的旅行里出现。',
  'help.guide.place-participants.tip.2':
    '一个人都没选表示所有人都去，正因为如此，停靠点上剩下的最后一个人是没法移出去的。',
  'help.guide.place-participants.tip.3': '没有自己账号的“访客”也可以像其他人一样成为参与者。',
  // place-booking
  'help.guide.place-booking.title': '停靠点上的预订',
  'help.guide.place-booking.goal': '读取属于某个停靠点的预订、打开它，并把新的预订挂上去。',
  'help.guide.place-booking.step.1':
    '打开该预订所属的停靠点。卡片显示一条横条，上面是“已确认”或“待确认”以及预订的名称。',
  'help.guide.place-booking.step.2': '这条横条带着“日期”“时间”和“预订码”，以及这笔预订的任何备注。',
  'help.guide.place-booking.step.3': '点击这条横条。该预订自己的表单就在上面打开。',
  'help.guide.place-booking.step.4':
    '“关联日程分配”就是把预订挂到停靠点上的字段，这里它已经写着这个停靠点。再把表单关掉。',
  'help.guide.place-booking.step.5':
    '为某个停靠点新建预订要从天数栏开始：鼠标悬停在停靠点上，点击它末尾的 +。表单以“新建预订”打开，并已经关联到它。',
  'help.guide.place-booking.result': '预订挂在停靠点上：它在卡片里、在当天里，它的文件也列在这里的“文件”下面。',
  'help.guide.place-booking.tip.1': '这条横条只对预订所挂的那个停靠点显示。没有停靠点的预订待在“预订”标签页里。',
  'help.guide.place-booking.tip.2': '多条预订可以共用一个停靠点：午餐，以及从同一个门口出发的那趟行程。',
  'help.guide.place-booking.tip.3': '火车、航班或渡轮打开的是交通表单，也就是“交通”标签页用的那个。',
  // place-files
  'help.guide.place-files.title': '把地点的票据和地点放在一起',
  'help.guide.place-files.goal': '把某个地点的票、凭证或地图放在你之后会去找的地方。',
  'help.guide.place-files.step.1': '打开这个地点。“文件”在卡片底部，地点还没有文件时它就显示“文件”。',
  'help.guide.place-files.step.2': '点击旁边的“上传”并选择文件。',
  'help.guide.place-files.step.3': '按钮会数出地点拥有的数量，列表自己展开。',
  'help.guide.place-files.step.4': '每一行是文件的名称和大小。点击它就能打开文件。',
  'help.guide.place-files.result': '文件留在地点上，在卡片里被计数，同时也在旅行的“文件”标签页里。',
  'help.guide.place-files.tip.1': '“文件”也会列出挂在这个停靠点预订上的文件，所以酒店的确认单会出现在酒店上。',
  'help.guide.place-files.tip.2': '“上传”一次可以接收多个文件。',
  'help.guide.place-files.tip.3': '没有“上传文件”权限时，“上传”按钮就不在那里；地点上已有的文件仍然在。',
  // place-navigation
  'help.guide.place-navigation.title': '在地图应用或网站上打开一个地点',
  'help.guide.place-navigation.goal': '把地点交给真正能带你过去的那个应用。',
  'help.guide.place-navigation.step.1': '打开这个地点，点击底部那一行的“导航”。',
  'help.guide.place-navigation.step.2':
    '列表是适合这个地点的地图应用：Google Maps、Waze、Apple Maps、OpenStreetMap 和 CoMaps。',
  'help.guide.place-navigation.step.3':
    '点击你用的那个。能做到的时候，TREK 交给它的是地点本身，而不只是一对坐标，所以你会落在正确的入口。',
  'help.guide.place-navigation.step.4': '旁边的“打开网站”会在新标签页里打开地点自己的页面、它的时间和它的门票。',
  'help.guide.place-navigation.result': '地图应用在这个地点上打开，网站在单独的标签页里打开，旅行里什么都不会改变。',
  'help.guide.place-navigation.tip.1': 'Waze 会立刻开始导航。其他应用打开这个地点，从那里出发还要再点一下。',
  'help.guide.place-navigation.tip.2':
    '提供哪些应用取决于地点和你的设备：Android 上不列出 Apple Maps，高德地图只对中国的地点出现，而 Waze、Apple Maps 和 CoMaps 需要地点的坐标。',
  'help.guide.place-navigation.tip.3': '当只有一个应用适用时，按钮会带上那个应用的名字并直接打开它。',
  // place-to-collection
  'help.guide.place-to-collection.title': '把地点保存到你的某个列表',
  'help.guide.place-to-collection.goal': '把这趟旅行里发现的地点留给下一趟。',
  'help.guide.place-to-collection.step.1': '打开这个地点，点击卡片底部的“保存到收藏”。',
  'help.guide.place-to-collection.step.2':
    '“保存到列表”会显示你拥有或共享的每一个列表。已经装着这个地点的列表带有对勾。',
  'help.guide.place-to-collection.step.3': '点击那个列表。地点立刻就在里面了。',
  'help.guide.place-to-collection.step.4': '关闭后，卡片里的按钮显示“已保存”。',
  'help.guide.place-to-collection.result': '地点带着它的图片、备注和地址，留在你的列表里，为下一趟旅行做好准备。',
  'help.guide.place-to-collection.tip.1': '这个按钮只在“收藏”扩展开启时才有，而它由管理员在“扩展”下打开。',
  'help.guide.place-to-collection.tip.2':
    '一个地点可以同时待在多个列表里，在每个列表里有各自的状态：在一个里是“想法”，在另一个里是“已去过”。',
  'help.guide.place-to-collection.tip.3':
    '选择器里地点名称旁的“标记为已去过”会在那个列表里把它勾掉；当地点在你的多个列表里时，那个胶囊按钮显示“在所有清单中标记”，一次就把它们全部处理掉。',
  // place-track
  'help.guide.place-track.title': '读一条轨迹并给它自己的颜色',
  'help.guide.place-track.goal': '看看导入的一段步行有多长，并把它的线和地图上其他的线区分开。',
  'help.guide.place-track.step.1': '地点栏里轨迹那一行带着一小段短线，颜色就是它的线所用的颜色。点击它。',
  'help.guide.place-track.step.2': '“轨迹数据”给出路径的长度，使用你设置的“距离单位”。',
  'help.guide.place-track.step.3': '它上面的“轨迹颜色”显示正在使用的颜色。点击这一行可以打开色板。',
  'help.guide.place-track.step.4': '选一个颜色。地图上的线和行上的那段短线会随之改变。',
  'help.guide.place-track.step.5':
    '左边的虚线格子“自动颜色”把轨迹交还给它继承来的颜色；右边的吸管“选择自定义颜色”会打开你系统的取色器，用来选其他任何颜色。',
  'help.guide.place-track.result': '轨迹会用你选的颜色绘制，在卡片里、在地点栏它那一行上，以及在地图上都是如此。',
  'help.guide.place-track.tip.1': '只有带着路径的地点，也就是从 GPX、KML 或 KMZ 文件导入的地点，才有这两个区块。',
  'help.guide.place-track.tip.2':
    '记录了高度的轨迹还会显示它的最高点和最低点、上升和下降的米数，以及这段步行的剖面图。',
  'help.guide.place-track.tip.3': '一次导入会给它带进来的每条轨迹一个各自的颜色，所以两段步行绝不会以同一个颜色到达。',
  // read-place
  'help.guide.read-place.step.7':
    '底部那一行是你在这里能做的事：把地点从打开的那一天移出或放进去、保存到某个列表、在地图应用里打开、编辑或删除。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '文件',
  'help.ctx.trip-files.summary':
    '旅行的每一份文档都在一份列表里：车票、确认单、通行证和图片，每一份都带一条备注、一条通向它所属地点或预订的链接，还有一个可以把它捞回来的回收站。',
  'help.ctx.trip-files.bullet.1':
    '顶部的“将文件拖放到此处”接收文件；点击这个框会打开文件选择器。它下面那行列出这台 TREK 接受的文件类型，以及每个文件 50 MB 的上限。',
  'help.ctx.trip-files.bullet.2':
    '标签决定列表显示什么：“全部”“PDF”“图片”和“文档”，每个后面带着数量。只要有文件被收藏，就会多出一个星标标签；只要有笔记带了附件，就会多出“协作笔记”。',
  'help.ctx.trip-files.bullet.3':
    '一行带着上传者、名称、下面的备注、大小和日期，以及每条链接一个徽章：“日程计划”和那个地点，“预订”或“交通”和那笔预订，“来自协作笔记”。',
  'help.ctx.trip-files.bullet.4':
    '行末是“收藏”“分配”“打开”“下载”和“删除”。“删除”不会先问：文件进回收站，在那里可以再拿回来。',
  'help.ctx.trip-files.bullet.5':
    '图片或视频全屏打开，可以用方向键和一条缩略图带翻看；其他文档在页面之上的预览里打开，带“在新标签页中打开”和“下载”。钱包通行证则直接下载。',
  'help.ctx.trip-files.bullet.6':
    '右端的“回收站”把列表切换到已删除的文件，在那里每一个都可以恢复或永久删除，“清空回收站”把它们全部清掉。在管理员接好文档存储的地方，“文档同步”就在它旁边。',
  // files-upload
  'help.guide.files-upload.title': '把文档放进旅行',
  'help.guide.files-upload.goal':
    '把一张车票、一份确认单或一张照片从你的下载文件夹挪进旅行，让旅行里的每个人都能拿到。',
  'help.guide.files-upload.step.1': '打开旅行，点击标签栏里的“文件”。旅行的文档列在那里，上面是上传框。',
  'help.guide.files-upload.step.2':
    '点击“将文件拖放到此处”，选一个或多个文件。文件会一个接一个上传，过程中框里写着“上传中...”。框下面那行说明这台 TREK 接受哪些类型，以及一个文件最多 50 MB。',
  'help.guide.files-upload.step.3':
    '最后一个文件上传完，“分配文件”就自己为它打开。“添加备注...”给这个文件一行自己的说明，它下面的列表把文件系到某个地点或某笔预订上。用 × 关掉；关掉不会丢失任何东西。',
  'help.guide.files-upload.step.4':
    '新文件排在列表最上面。一行显示上传者、名称、大小和日期；图片有缩略图，其他文件显示它的类型。',
  'help.guide.files-upload.result': '文档已经在旅行里，能看到这趟旅行的人都可以打开和下载它们。',
  'help.guide.files-upload.tip.1': '文件也可以从桌面直接拖到这个框上，文件悬在上面时框会亮起来。',
  'help.guide.files-upload.tip.2': '剪贴板里的图片用 Ctrl+V 就进了列表，所以预订的截图不必先存一份。',
  'help.guide.files-upload.tip.3':
    '上传需要“上传文件”这项权限；没有它，这个框根本不会出现。不在列表上的类型会连同一条提示被拒绝，什么也不会上传。超过 50 MB 的文件在任何东西被送出之前，就被这个框自己挡下。',
  // files-link
  'help.guide.files-link.title': '把文档系到地点或预订上',
  'help.guide.files-link.goal': '让这张票从它所属的那一天也能找到，而不只是从这份列表里。',
  'help.guide.files-link.step.1': '点击行末的铅笔“分配”。以文件命名的“分配文件”打开。',
  'help.guide.files-link.step.2':
    '在“备注”下面，“添加备注...”接收一行字，这行字随后出现在列表里文件名的下方。你一离开这个输入框它就保存了。',
  'help.guide.files-link.step.3':
    '“地点”下面是旅行的各个地点，按它们所在的那一天分组，最后是“未分配”，放不在任何一天里的地点。点一个，它就打上勾。',
  'help.guide.files-link.step.4': '“预订”和“交通”下面是旅行的各笔预订。点文档所属的那一笔，它也会打上勾。',
  'help.guide.files-link.step.5': '用 × 关掉。这里没有保存按钮：每一次点击在你点的那一刻就已经写下了。',
  'help.guide.files-link.result':
    '这一行带着备注，每条链接一个徽章，“日程计划”和地点的名字，“交通”和航班的名字，同时这份文档也挂在那个地点和那个航班上。',
  'help.guide.files-link.tip.1': '一个文件可以同时带多条链接，所以同一份确认单既属于酒店，也属于它所覆盖的那一晚。',
  'help.guide.files-link.tip.2': '再点一次已打勾的条目就取消那条链接；文件本身还在。',
  'help.guide.files-link.tip.3': '反过来也成立：附在某个地点或某笔预订上的文档同样在这份列表里，行上带着同样的徽章。',
  // files-star
  'help.guide.files-star.title': '把重要的文档留在最上面',
  'help.guide.files-star.goal': '从一份整趟旅行都在变长的列表里，把你真正会用到的那两三份材料挑出来。',
  'help.guide.files-star.step.1': '点击行末的“收藏”。星星被填成黄色，文件名前面又出现一颗星，按钮现在写着“取消收藏”。',
  'help.guide.files-star.step.2': '列表会重新排序：收藏的文件排在其他所有文件之上，每一组之内按最新在前。',
  'help.guide.files-star.step.3': '顶部的标签里多了一颗星，后面跟着收藏文件的数量。点击它，就只看这些文件。',
  'help.guide.files-star.result': '你在柜台要用的材料排在列表最上面，还有一个标签里只有它们。',
  'help.guide.files-star.tip.1': '星标标签只在有东西被收藏时才存在。取消最后一个文件的收藏，这个标签也跟着消失。',
  'help.guide.files-star.tip.2': '收藏算一次编辑：没有“编辑文件元数据”权限、只能读旅行文件的成员看得见星标，却按不动。',
  // files-filter
  'help.guide.files-filter.title': '在列表里找到一份文档',
  'help.guide.files-filter.goal': '把一份什么都有的列表，缩到你要找的那一类材料。',
  'help.guide.files-filter.step.1': '列表上方的标签是“全部”“PDF”“图片”和“文档”，每个后面带着文件数量。',
  'help.guide.files-filter.step.2': '点击“PDF”：列表只留下 PDF 文件，别的都不留。',
  'help.guide.files-filter.step.3':
    '另外两个标签会随旅行里的内容来去。点击“协作笔记”，只要“协作”标签里的笔记带了附件它就在：列表里只留下那些文件，别的都没有。一颗星也以同样的方式加进这一排，只要有文件被收藏。',
  'help.guide.files-filter.step.4': '“全部”把整份列表带回来。',
  'help.guide.files-filter.result': '列表只显示标签所指的东西，每个标签上的数字说明那是多少份。',
  'help.guide.files-filter.tip.1':
    '这里没有文件夹，也不能改名：“分配文件”里的备注、通向地点和预订的链接，还有星标，就是文档的归类方式。',
  'help.guide.files-filter.tip.2': '列表本身永远是收藏在前，然后最新在前，所以今天上传的文档排在上个月那份的上面。',
  // files-preview
  'help.guide.files-preview.title': '不离开 TREK 就读一份文档',
  'help.guide.files-preview.goal': '就地看一张票或一张图片，需要时再把它弄到自己的机器上。',
  'help.guide.files-preview.step.1': '点击图片的名称或它的缩略图。它会全屏打开，顶部有文件名和它在这组图片中的位置。',
  'help.guide.files-preview.step.2':
    '两侧的圆形箭头、左右方向键和底部的缩略图带，都能在列表当前显示的每一张图片之间移动。',
  'help.guide.files-preview.step.3': '“在新标签页中打开”和“下载”在顶部；× 或 Escape 再把图片关掉。',
  'help.guide.files-preview.step.4':
    '不是图片的文档改为在页面之上的预览里打开，顶部同样是这两个按钮。这一个用 × 或点它旁边就能关掉。',
  'help.guide.files-preview.step.5': '行末的“下载”把文件直接存到你的机器上，不先打开任何东西。',
  'help.guide.files-preview.result': '文档就在屏幕上，同样这两个按钮把它放进浏览器标签页或你的硬盘。',
  'help.guide.files-preview.tip.1': '在触摸屏上，你是滑动着翻图片，而不是点箭头。',
  'help.guide.files-preview.tip.2': '钱包通行证从不打开预览：它会立即下载，好让手机把它交给钱包应用。',
  'help.guide.files-preview.tip.3':
    '“在新标签页中打开”和“下载”都用你的会话去取文件，所以从地址栏复制出来的链接对别人毫无用处。',
  // files-trash
  'help.guide.files-trash.title': '扔掉一份文档，再把它找回来',
  'help.guide.files-trash.goal': '清掉旅行不再需要的东西，又不会丢掉其实还需要的。',
  'help.guide.files-trash.step.1': '点击行末的“删除”。文件立刻离开列表，提示写着“已移至回收站”。没有人先问你。',
  'help.guide.files-trash.step.2': '工具栏右端的“回收站”把列表切换到被扔掉的东西。标题变成“回收站”，筛选标签不见了。',
  'help.guide.files-trash.step.3':
    '被扔掉的行是灰的，只剩两个按钮：“恢复”，把文件带回来；“删除”，先问一句再把它永久移除。',
  'help.guide.files-trash.step.4': '点击“恢复”。提示写着“文件已恢复”，这一行离开回收站，备注和链接都还在它身上。',
  'help.guide.files-trash.step.5':
    '顶部的“清空回收站”把还留在这里的一切永久清掉，浏览器在动手前会问一次。“回收站”再切回文件列表。',
  'help.guide.files-trash.result': '文件回到了列表里它原来的位置，就像什么也没发生过。',
  'help.guide.files-trash.tip.1': '行上的“删除”不会先问，回收站正是为此而设：在你于此处发话之前，没有东西会离开 TREK。',
  'help.guide.files-trash.tip.2':
    '扔掉一个文件再把它找回来，需要“删除文件”这项权限。没有这项权限的成员既看不到行上的“删除”，也看不到回收站里的按钮。',
  'help.guide.files-trash.tip.3': '在回收站里被永久删除的文件无法再找回来。',
  // files-sync
  'help.guide.files-sync.title': '让文档与你的文档存储保持同步',
  'help.guide.files-sync.goal': '把旅行绑定到你自己的文档存储，这样在这里上传的会落到那里，在那里归档的会出现在这里。',
  'help.guide.files-sync.step.1':
    '点击“文档同步”，它在工具栏右端“回收站”的旁边。对话框打开，标题下写着旅行的名称。左侧“连接文档服务”下列着管理员开启的存储，每个带一行说明它怎样归档：Paperless-ngx 和 Papra 按标签归档，Nextcloud 和 Synology Drive 归档到文件夹，OpenCloud 归档到空间。右侧写着“尚未连接任何服务”。',
  'help.guide.files-sync.step.2':
    '点击你的存储，这里是 Nextcloud。一个较小的对话框为这次连接打开，以存储命名，询问这个存储登录所需的信息。',
  'help.guide.files-sync.step.3':
    '填写“地址”和该存储自己的登录信息：Paperless-ngx 要“API 令牌”，Papra 要“API 密钥”和“组织 ID”，Nextcloud 要“用户名”和“应用密码”，OpenCloud 要“用户名”和“应用令牌”，Synology Drive 要“用户名”、“密码”，如果账户要求，还要“两步验证码”。只要存储提供应用密码或令牌，就用它，绝不要用你的账户密码。Nextcloud 和 Synology Drive 还可以填一个可选的“基础文件夹”，TREK 在那里查找旅行文件夹，这里是 /Reisen。底部的“接受自签名证书”只给你自己网络里带这种证书的存储用。',
  'help.guide.files-sync.step.4':
    '点击“测试连接”。TREK 用你输入的内容去连存储，页脚写着“已连接，登录身份为”加上账户名。凭据被拒绝或地址连不上时，会在那里写明，而且无论哪种情况都不会保存。',
  'help.guide.files-sync.step.5':
    '点击“连接”。连接随旅行保存，TREK 会问这次旅行应放在存储的什么位置：存放其文档的标签、文件夹或空间。只有那里面的内容会同步。“新建一个”在点击“创建”时建好它，名称已按旅行标题预填；“或使用已有的”下列着已经存在的。点击一个，这里是文件夹 Autumn in Japan。',
  'help.guide.files-sync.step.6':
    '对话框回来了：你的存储在左侧“本次行程”下，右侧它的卡片带着同步目标、上次运行时间和“立即同步”。第一次运行会自己开始；“立即同步”随时再跑一次。一次运行完成后，名称旁的“尚未同步”徽章让位给一个绿点，指向它时显示“已同步”，流向条统计 TREK 和存储各自持有的文档数，中间是“发往文档服务”和“来自文档服务”两条通道。用 × 关闭对话框。',
  'help.guide.files-sync.result':
    '那里原本就有的文档排在列表顶部，以你的名义上传，而旅行的每份文档也都进了存储。从此 TREK 在后台检查存储，存储跟随列表。',
  'help.guide.files-sync.tip.1':
    '只有旅行的所有者或实例管理员能绑定旅行，因为登录凭据能触及存储中的整个账户。每位成员都可以打开“文档同步”、查看卡片并按“立即同步”。',
  'help.guide.files-sync.tip.2':
    '你自己网络里的存储需要 TREK 服务器上设置 ALLOW_INTERNAL_NETWORK=true，而且它的地址必须是那台机器在网络里的地址，绝不能是 localhost。没有这些，“测试连接”会回答“不允许使用该地址。”',
  'help.guide.files-sync.tip.3':
    '卡片上的“断开连接”结束配对，并保留两边的每一份文档。第二次绑定的标签、文件夹或空间被当作新的，里面的一切都会再进来一次，所以“断开连接”之后请绑定一个空的，而不是原来那个。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日程详情',
  'help.ctx.trip-day-detail.summary':
    '由某一天的标题栏在地图上方打开的面板：这一整天、它的名称和日期、你将身处之地的天气、落在这一天的预订，以及为它订下的住宿夜晚。',
  'help.ctx.trip-day-detail.bullet.1':
    '在天数栏里点击某一天的标题栏，面板就在地图中间上方打开。再次点击同一个标题栏，或者点它右端的 X，就关闭面板并放开这一天。',
  'help.ctx.trip-day-detail.bullet.2':
    '标题栏上是这一天的名称和日期。名称旁的铅笔用来重命名这一天，双箭头把面板折叠成一条细栏，地图又空出来。',
  'help.ctx.trip-day-detail.bullet.3':
    '最上面是这一天的天气。“…的天气预报”指明它对应哪个地点：这一天的第一个停靠点，或者你醒来时所在的酒店。',
  'help.ctx.trip-day-detail.bullet.4':
    '“预订”列出那一天的预订，每条都带类型、所属停靠点和时间。绿色表示已确认，琥珀色还是待确认；这里只是读数，预订要在“预订”标签页里更改。',
  'help.ctx.trip-day-detail.bullet.5':
    '“住宿”显示压在这一天上的每一晚，“入住”和“退房”出现在各自发生的那一天，还有入住时间段、退房时间和确认号。',
  'help.ctx.trip-day-detail.bullet.6':
    '“添加住宿”在这一天订下一晚：从旅行的地点里挑出住处，说明它覆盖哪几天，再补上时间和确认号。',
  // day-panel
  'help.guide.day-panel.title': '打开一天并读它的详情',
  'help.guide.day-panel.goal': '不离开地图，就看到完整的一天、它的天气、它的预订，以及你睡在哪里。',
  'help.guide.day-panel.step.1': '在天数栏里点击某一天的标题栏。这一天被选中，它的详情在地图中间上方打开。',
  'help.guide.day-panel.step.2': '标题栏写出这一天的名称，在你给它起名之前是“第 1 天”，下面是日期。',
  'help.guide.day-panel.step.3':
    '最上面是这一天的天气。“…的天气预报”说明它对应哪个地点：这一天的第一个停靠点，或者你醒来时所在的酒店。',
  'help.guide.day-panel.step.4': '它下面的“预订”列出落在这一天的预订，连同它们的时间。',
  'help.guide.day-panel.step.5': '“住宿”显示压在这一天上的夜晚，“入住”和“退房”出现在各自发生的那一天。',
  'help.guide.day-panel.step.6': '标题栏上的双箭头把面板折叠成一条细栏。旁边的 X 关闭面板并放开这一天。',
  'help.guide.day-panel.result':
    '折成细栏时，面板让地图保持空闲，这一天仍然被选中；关闭之后，这一天取消选中，计划回到原样。',
  'help.guide.day-panel.tip.1': '点击面板标题栏上的任何地方同样会折叠它。那个箭头只是为此准备的按钮。',
  'help.guide.day-panel.tip.2': '从地点栏打开一个地点，会把地点详情放到面板的位置上。把它关掉，这一天就回来了。',
  // day-weather
  'help.guide.day-weather.title': '读这一天的天气',
  'help.guide.day-weather.goal': '知道那一天在你真正身处的地方会是什么天气。',
  'help.guide.day-weather.step.1':
    '“…的天气预报”指明这些数字属于哪个地点：这一天的第一个停靠点，或者在没有停靠点的一天里，你醒来时所在的酒店。',
  'help.guide.day-weather.step.2': '大数字是这一天的气温，旁边是最低和最高，以及用文字说明的天气状况。',
  'help.guide.day-weather.step.3': '下面的小标签：降水概率、降水量、最强的风，还有日出和日落。',
  'help.guide.day-weather.step.4':
    '最下面是这一天的逐小时情况，每隔两小时一格：时间、图标、气温和降水概率。超过 50% 的小时会染成蓝色。',
  'help.guide.day-weather.result': '天数栏里这一天的卡片，也在它的编号下面用小字带着同样的天气，整趟行程一眼就能读完。',
  'help.guide.day-weather.tip.1':
    '温度和风跟随设置里“显示”下的“温度单位”：选“°F Fahrenheit”，同一份预报就用 °F 和 mph 读出来。',
  'help.guide.day-weather.tip.2':
    '既没有带坐标的停靠点、也没有可以醒来的酒店的一天，完全不显示天气：预报永远是针对一个地点，而不是针对整趟旅行。',
  'help.guide.day-weather.tip.3':
    '超过 16 天之后就没有预报可拿。那时的数字是往年这个日期的平均值，用 Ø 标出，并在下面注明。',
  // rename-day
  'help.guide.rename-day.title': '给这一天起个名字',
  'help.guide.rename-day.goal': '把一天叫成它本来的样子，“抵达 Kyoto”或者“休息日”，而不是“第 5 天”。',
  'help.guide.rename-day.step.1': '打开这一天。它的标题栏写着“第 5 天”，下面是日期。',
  'help.guide.rename-day.step.2': '点击名称旁边的铅笔。',
  'help.guide.rename-day.step.3': '名称变成一个输入框。输入你想要的名字。',
  'help.guide.rename-day.step.4':
    '按 Enter，或者干脆点别处；Escape 会丢掉这次修改。天数栏里这一天的卡片也会带上这个名字。',
  'help.guide.rename-day.result': '这个名字在面板里和天数栏的卡片上取代“第 5 天”；日期还留在原处。',
  'help.guide.rename-day.tip.1': '把输入框清空再保存，这一天就又是“第 5 天”：没有名字时显示的就是编号。',
  'help.guide.rename-day.tip.2': '名字属于这一天，而不属于它的日期。重新排列各天，它会和这一天上的其他一切一起走。',
  // add-accommodation
  'help.guide.add-accommodation.title': '在某一天订下一晚',
  'help.guide.add-accommodation.goal': '把酒店一次性放进计划，连同它覆盖的天数、时间和确认号。',
  'help.guide.add-accommodation.step.1':
    '住处必须先是旅行里的一个地点。像创建其他地点一样在地点栏里创建它：选择器只提供已经存在的东西。',
  'help.guide.add-accommodation.step.2': '打开你抵达的那一天，点击“住宿”下面的“添加住宿”。',
  'help.guide.add-accommodation.step.3':
    '“应用到天数”说明这次住宿覆盖哪几晚：左边是入住日，右边是退房日。“全部”覆盖整趟旅行。',
  'help.guide.add-accommodation.step.4': '填写“入住”“截止”和“退房”，把预订号填在“确认号”里。这四项都可以留空。',
  'help.guide.add-accommodation.step.5': '从旅行的地点里挑出住处。列表上方的小标签把它收窄到一个分类。',
  'help.guide.add-accommodation.step.6': '点击“保存”。',
  'help.guide.add-accommodation.result':
    '这次住宿出现在它覆盖的每一天上，第一天是“入住”，最后一天是“退房”。住处成为入住日的一个停靠点，地图因此画出去那里的路线，而“预订”标签页里出现一条“住宿”预订。',
  'help.guide.add-accommodation.tip.1': '选择器以你打开的那一天开始，退房是它的后一天；保存之前两者都可以移动。',
  'help.guide.add-accommodation.tip.2': '创建酒店时给它旅行里的 Hotel 分类，列表上方的小标签一点就只剩下你的酒店。',
  'help.guide.add-accommodation.tip.3':
    '时间全是可选的：没有入住时间、也没有确认号的住宿，照样覆盖它的夜晚，照样画出它的路线。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '更改或取消已订下的住宿',
  'help.guide.edit-accommodation.goal': '挪动一次住宿、改正它的时间，或者把它再从计划里拿出去。',
  'help.guide.edit-accommodation.step.1': '在住宿的每一天里，卡片都显示住处、入住时间段、退房时间和确认号。',
  'help.guide.edit-accommodation.step.2': '它右边的铅笔重新打开这次住宿。弹窗此时写着“编辑住宿”。',
  'help.guide.edit-accommodation.step.3':
    '改这一排字段：“入住”“截止”“退房”和“确认号”。它上面的天数和它下面的住处，在这里也能改。',
  'help.guide.edit-accommodation.step.4': '点击“保存”。',
  'help.guide.edit-accommodation.step.5': '铅笔旁边的 X 结束这次住宿。它什么都不问，属于它的那条“住宿”预订也一并消失。',
  'help.guide.edit-accommodation.result': '这次更改一次就到达住宿覆盖的每一天，“预订”标签页里那条“住宿”预订也跟着变。',
  'help.guide.edit-accommodation.tip.1':
    '住宿中间的夜晚不带“入住”也不带“退房”标签：只有这个区间的第一天和最后一天才有。',
  'help.guide.edit-accommodation.tip.2':
    '取消一次住宿，也会带走它放在入住日的那个停靠点，以及挂在它预订上的任何费用。如果是弄错了，就重新订一次。',
  // day-bookings
  'help.guide.day-bookings.title': '一眼看完这一天的预订',
  'help.guide.day-bookings.goal': '在一个地方看到这一天已经订好了什么，以及是否已确认。',
  'help.guide.day-bookings.step.1': '“预订”列出这一天的预订：日期落在这一天的，以及挂在它某个停靠点上的。',
  'help.guide.day-bookings.step.2':
    '一行显示这是哪种预订、它的名称，如果它属于某个停靠点，就在一个圆点之后写出那个停靠点。它的时间在右端。',
  'help.guide.day-bookings.step.3':
    '颜色说明一条预订处在什么状态：绿色的行已确认，琥珀色的还在待确认。酒店不在这个列表里，它们在下面有自己的板块。',
  'help.guide.day-bookings.step.4': '这个列表只把预订读出来。预订要在“预订”标签页里创建和更改。',
  'help.guide.day-bookings.result': '日期落在这一天的一切，以及挂在它某个停靠点上的一切，都在这一个列表里。',
  'help.guide.day-bookings.tip.1':
    '一条预订按它自己的日期落到某一天上。在“预订”标签页里改掉日期，它就自己挪到另一天去。',
  'help.guide.day-bookings.tip.2': '没有“预订”板块，就说明这一天没有预订：它被隐藏起来，而不是空着显示。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '地图',
  'help.ctx.trip-map.summary':
    '计划的中间：旅行的每一个地点都是一枚图钉，还有把它们连起来的路线，以及地图边缘那些开关，用于卫星影像、一次看完整个行程，以及查找你正在看的这片城区周围的地点。',
  'help.ctx.trip-map.bullet.1':
    '一枚图钉就是一个地点：有照片时用它自己的照片，否则用它的分类颜色加分类图标。把指针停在一枚图钉上，会出现一张卡片，写着它的名称和地址，地点带有分类和评分时也会写上。把图钉拖到某一天的卡片上，就把这个地点安排到那一天。',
  'help.ctx.trip-map.bullet.2':
    '挨得太近分不开的图钉会折叠成一个深色气泡，上面带着数量。点击气泡，地图就缩放到里面的内容。',
  'help.ctx.trip-map.bullet.3':
    '点击一枚图钉，地点就在地图下方打开，带着它的评分、它的“文件”以及接下来可以对它做的事；点击地图上空白的地方就又把它放开。',
  'help.ctx.trip-map.bullet.4':
    '当天数栏里有某一天打开时，它的停靠点会带一个白色小徽章，写着它在那一天里的序号；被安排在两天上的地点会带着两个序号，中间用 · 连起来。',
  'help.ctx.trip-map.bullet.5':
    '顶部那排图标会在你看得见的那片地图里搜索：“餐厅”“咖啡馆”“酒吧与夜生活”“住宿”“景点”“博物馆与文化”“自然与公园”和“活动”。在你移动地图之后，“搜索此区域”会再跑一次。',
  'help.ctx.trip-map.bullet.6':
    '在地图上任意位置右键点击，就会在那个点打开地点表单，地址已经查好了。左下角的圆形按钮把绘制的地图换成航拍影像。',
  'help.ctx.trip-map.bullet.7':
    '右下角的“显示整个行程”一次画出每一个出行日，并列出每一天走了什么；预订那一行上的路线图标画出那一笔预订，而天数栏上方工具栏里的那个图标把它们全都画出来。',
  // map-markers
  'help.guide.map-markers.title': '读懂地图',
  'help.guide.map-markers.goal': '知道地图上每一枚图钉、每一个徽章和每一个气泡在告诉你什么。',
  'help.guide.map-markers.step.1':
    '地图上有旅行的每一个地点。图钉挨得太近分不开的地方，它们会折叠成一个深色气泡，上面带着里面的数量；点击气泡，地图就缩放到刚才在里面的内容，在最深的缩放级别上则把图钉像扇子一样摊开。',
  'help.guide.map-markers.step.2':
    '一枚图钉是这个地点自己的照片（如果有的话），否则是它的分类颜色加分类图标。把指针停在一枚上，卡片会给出它的名称和地址，地点带有分类和评分时也会给出。',
  'help.guide.map-markers.step.3':
    '点击一枚图钉，地点就在地图下方的一张卡片里打开：它的坐标、它的评分、它的“文件”，最下面一排则是接下来能对它做的事，其中有“导航”“编辑”和“删除”，打开了某一天时还有“添加到当天”。点击地图上空白的地方就又把它放开。',
  'help.guide.map-markers.step.4':
    '在天数栏里打开某一天，它的停靠点就会被编号：图钉角上的白色小徽章就是这个停靠点在这一天里的次序。被安排在两天上的地点会带着两个序号，中间用 · 连起来。没有打开任何一天时就没有编号，角上改为显示评分。',
  'help.guide.map-markers.step.5':
    '把一枚图钉从地图上拖到天数栏里某一天的卡片上，这个地点就被安排到那一天，和把它在地点列表里的那一行拖出去完全一样。',
  'help.guide.map-markers.result':
    '旅行本身没有任何变化：地图只是看它的一种方式，而每一枚图钉都说明是哪个地点、哪一天、按什么顺序。',
  'help.guide.map-markers.tip.1':
    '在天数栏里被折叠起来的一天，会把它的停靠点一起从地图上带走；再把这一天打开，它们就回来了。',
  'help.guide.map-markers.tip.2':
    '地点列表上方的筛选也决定地图画什么：选“未规划”，地图上就只剩下还没有排进某一天的地点。',
  'help.guide.map-markers.tip.3': '这张地图上没有缩放按钮：滚轮缩放，双击放大一级，拖动地图本身则移动它。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '在地图上查找你周围的地点',
  'help.guide.map-nearby-places.goal': '让地图在你正在看的这片城区里找餐厅、景点或一家酒店，并把其中一个带进旅行。',
  'help.guide.map-nearby-places.step.1':
    '地图顶部那排图标就是分类搜索：“餐厅”“咖啡馆”“酒吧与夜生活”“住宿”“景点”“博物馆与文化”“自然与公园”和“活动”。',
  'help.guide.map-nearby-places.step.2':
    '点击一个分类。TREK 会在你看得见的那片地图里找这一类地点，并为每一个结果落下一枚该分类颜色的图钉。一次只能开一个分类：点击另一个就会换过去，点击正在开着的那个就会关掉。',
  'help.guide.map-nearby-places.step.3':
    '移动地图，那排图标下面会出现第二个按钮：“搜索此区域”为新的视野跑同一个搜索。光是移动永远不会重新搜索，这样请求的次数就不会多。',
  'help.guide.map-nearby-places.step.4':
    '这些图钉带着它们找到的东西的名称。点击其中一枚，地点表单就打开，并且已经从它那里填好了：“名称”“地址”“纬度”和“经度”，以及 OpenStreetMap 有的话还有网站和电话号码。',
  'help.guide.map-nearby-places.step.5':
    '检查它填好的内容，再补上搜索不可能知道的东西：一段“描述”、一个“分类”、你自己的备注。',
  'help.guide.map-nearby-places.step.6':
    '点击“添加”。如果行程里已经有同名的地点，表单会这么说，按钮也会变成“仍然添加”。',
  'help.guide.map-nearby-places.result':
    '这个地点就在地点列表里，也在地图上，成为行程自己的一枚图钉，在你把它排进某一天之前都在“未规划”下面。搜索出来的图钉会一直留着，直到你把那个分类关掉。',
  'help.guide.map-nearby-places.tip.1': '当“设置”里“旅行与地图”下的“在地图上探索地点”关闭时，这排图标就不在了。',
  'help.guide.map-nearby-places.tip.2':
    '答案来自 TREK 的地点索引和 OpenStreetMap，所以这是计划上少数几件需要联网的事情之一。',
  'help.guide.map-nearby-places.tip.3':
    '一次搜索覆盖的是屏幕上的范围，所以请放大到你要问的那条街：整座城市回答的是前六十个结果，而且它们之间几乎没有什么顺序。',
  // map-add-place
  'help.guide.map-add-place.title': '右键点击地图来创建地点',
  'help.guide.map-add-place.goal': '把一个地点准确放在你想要的位置上，不必先去搜索它。',
  'help.guide.map-add-place.step.1': '在地图上你想要的位置右键点击。地点表单打开，标题是“添加地点/活动”。',
  'help.guide.map-add-place.step.2':
    '“纬度”和“经度”已经就在那个点上，TREK 会去查这组坐标，并用在那里找到的内容填好“地址”，查到名字时也把“名称”填上。还什么都没有写进去，所以哪里不对就覆盖掉。',
  'help.guide.map-add-place.step.3':
    '给它一个你认得出来的“名称”，再写上计划应该知道的其余内容：“描述”“备注”“分类”“网站”。',
  'help.guide.map-add-place.step.4':
    '点击“添加”。即使有某一天打开着，这个地点也是以未规划的状态落进列表：在地图上右键点击说的是在哪里，不是在什么时候。',
  'help.guide.map-add-place.result': '这个地点就在列表里，也在地图上，在你把它排进某一天之前都在“未规划”下面。',
  'help.guide.map-add-place.tip.1':
    '地址来自对坐标的反查，所以它读起来可能是一条街而不是一个名字，在旷野上还可能查回来是空的。这两个字段都由你来覆盖。',
  'help.guide.map-add-place.tip.2':
    '在 MapLibre GL 和 Mapbox GL 的地图上，点击中键也是一样的效果，在触摸屏上则是长按。',
  // map-satellite
  'help.guide.map-satellite.title': '切换到卫星',
  'help.guide.map-satellite.goal': '把绘制的地图换成航拍影像，再换回来。',
  'help.guide.map-satellite.step.1':
    '地图左下角的圆形按钮就是底图图层开关。它的图标始终显示它将要切换到的那一层，把指针停上去会说明是哪一层：“切换到卫星视图”。点击它。',
  'help.guide.map-satellite.step.2':
    '地图现在是航拍影像，清晰到能分辨出单独一栋建筑，而且不需要你自己的密钥。TREK 画的一切都留在它上面：图钉、当天的路线、轨迹和预订路线。',
  'help.guide.map-satellite.step.3': '按钮现在写着“切换到地图视图”。点击它就回到绘制的地图。',
  'help.guide.map-satellite.result': '地图又变回绘制的地图，而你最后停留的那一层会记在你的账户上。',
  'help.guide.map-satellite.tip.1':
    '这个选择保存在你的账户上，而不是在行程上，所以不管你用哪种地图渲染器，每一个行程都会按你离开时的样子打开。',
  'help.guide.map-satellite.tip.2':
    '航拍影像上没有文字：街道名、城区和门牌号都在绘制的地图上，所以要找地址时就切换回去。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '查看整个行程和它的距离',
  'help.guide.map-whole-trip.goal': '把打开的那一天换成行程的每一个出行日，并读出每一天走了多远。',
  'help.guide.map-whole-trip.step.1':
    '圆形的“显示整个行程”按钮位于地图右下角。点击它，行程的每一个出行日都会被一次画出来，每一天用自己的颜色画在白色外框之上，这样相邻的日子也分得清。',
  'help.guide.map-whole-trip.step.2':
    '按钮上方的卡片把这些日子列出来：一个色点、这一天的名称、你在这一天每种出行方式的图标，以及它覆盖的距离。“总距离”在最上面。',
  'help.guide.map-whole-trip.step.3':
    '在卡片里点击某一天就选中它，和在天数栏里选它是一样的：地图把那一天框进画面，它的停靠点也重新有了编号。',
  'help.guide.map-whole-trip.step.4': '按钮现在写着“隐藏整个行程”。按一下就回到打开的那一天。',
  'help.guide.map-whole-trip.result':
    '每一个出行日都用自己的颜色画出来，卡片说明每一天走了什么，以及整个行程加起来是多少。',
  'help.guide.map-whole-trip.tip.1':
    '总数是一段一段陆续到的。只要后面还跟着一个 …，这个数字就还是部分和；等每一段都回答了，它才稳定下来。',
  'help.guide.map-whole-trip.tip.2':
    '路线服务拒绝计算的那一段会保持为一条直线，并且不计入距离，卡片会把这件事说出来，而不是悄悄地显示得偏低。',
  'help.guide.map-whole-trip.tip.3': '有定位的停靠点不足两个的一天没有路线可画，因此它会被完全排除在卡片之外。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '在地图上显示一笔预订的路线',
  'help.guide.map-booking-routes.goal': '把你订好的航班、火车和自驾画到地图上，再把它们撤下来。',
  'help.guide.map-booking-routes.step.1':
    '预订路线在你提出要求之前是关着的。天数栏里预订那一行上有一个小小的路线图标：“显示预订路线”。',
  'help.guide.map-booking-routes.step.2':
    '点击它。这笔预订就出现在地图上：航班画成一条大圆弧，自驾沿着真实的道路，火车画成它各个车站串成的链条。“已确认”画成实线，“待确认”画成虚线，路线两端是带着交通方式图标的蓝色药丸。',
  'help.guide.map-booking-routes.step.3':
    '点击其中一端的药丸，就打开它背后的那笔预订，带着它的时间、它的“预订码”和“地点 / 地址”；“关闭”把它收起来。',
  'help.guide.map-booking-routes.step.4':
    '天数栏上方工具栏里的那个路线图标一次处理整个行程：“显示所有预订路线”会把每一笔有路线的预订都画出来。',
  'help.guide.map-booking-routes.step.5':
    '它是从白纸开始，而不是叠在上面的一层，所以你一笔一笔挑出来的那些都会被丢掉。再按一次，它现在写着“隐藏所有预订路线”，地图就清空了。',
  'help.guide.map-booking-routes.result':
    '你要求的那些预订被画在地图上，而这个选择会为这个行程保存在这个浏览器里，直到你改变它。',
  'help.guide.map-booking-routes.tip.1':
    '只有当“设置”里“旅行与地图”下的“预订路线标签”开着时，两端才会带上机场代码或车站名称；否则它们只显示图标。',
  'help.guide.map-booking-routes.tip.2':
    '同一处设置里的“始终显示预订路线”，会在你还没有做过决定的每一个行程上，从一开始就把它们画出来。',
  'help.guide.map-booking-routes.tip.3': '一笔预订必须有两个带坐标的端点才能被画出来，所以酒店或餐厅不会带路线图标。',
  'help.ctx.trip-map.bullet.8':
    '开着 Dawarich 扩展时，“显示整个行程”下方的圆形 Dawarich 按钮会画出你的手机实际记录的路线：“显示记录的路线”把它用虚线铺在计划路线下方，每天一种颜色，而在没有线的时候，按钮的标签会说明为什么没有。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '显示你实际走过的路线',
  'help.guide.map-dawarich-trail.goal':
    '把 Dawarich 在你手机上记录的路线铺到地图上，用虚线放在你计划的路线旁边，一天一天地读这次旅行实际是怎么走的。',
  'help.guide.map-dawarich-trail.step.1':
    '圆形 Dawarich 按钮在地图右下角，“显示整个行程”的下方；悬停时它写着“显示记录的路线”。点击它。TREK 向你的 Dawarich 查询这次旅行的日期，答案还在路上时，按钮周围有一个圆环在转。',
  'help.guide.map-dawarich-trail.step.2':
    '记录的路线以一条虚线落到地图上，每天一种颜色，画在计划路线下方，这样计划仍然可读。按钮现在写着“隐藏记录的路线”。天与天之间以当地午夜为界，在天数栏里折起的一天会把它的虚线连同它的停靠点一起从地图上收走。',
  'help.guide.map-dawarich-trail.step.3':
    '再点击“显示整个行程”，每个计划中的日子都以实线画在虚线记录旁边。两条线走在一起的地方，那一天按计划进行了；虚线跑偏的地方，就是没按计划的地方。',
  'help.guide.map-dawarich-trail.result':
    '你计划的和你实际做的一起在地图上，虚线对实线，而按钮上方的卡片仍然列着计划中的日子和它们的距离。',
  'help.guide.map-dawarich-trail.tip.1':
    '开或关按旅行记住，在这个浏览器会话内有效。路线开着时，TREK 每两分钟再问一次 Dawarich，所以进行中的旅行不用刷新也能跟上；路线本身从不保存，所以它不在 TREK 的数据库里，不在备份里，离线时也没有。',
  'help.guide.map-dawarich-trail.tip.2':
    '按钮的标签会解释空白的地图：还在路上时是“正在加载记录的路线…”，或者是“这些日期没有任何记录”“无法加载记录的路线”，TREK 离线时则是“查看记录的路线需要网络连接”。',
  // map-compass
  'help.guide.map-compass.title': '转动地图并重新找到北',
  'help.guide.map-compass.goal': '把地图转到你前进的方向，再用一下点击把它弹回正北。',
  'help.guide.map-compass.step.1':
    '用右键拖动来转动地图，或者按住 Ctrl 用左键拖动；在触摸屏上，用两根手指扭转。地图顶部分类图标那一排旁边的圆形罗盘会跟着转：它的箭头始终指向北，所以你转了多少，它就斜多少。',
  'help.guide.map-compass.step.2':
    '点击罗盘。这个按钮叫“Reset north”，它把地图平缓地转回北在上方的平视状态，箭头重新竖直。',
  'help.guide.map-compass.result': '地图重新北朝上、恢复水平，旅行里什么都没变：罗盘只移动镜头。',
  'help.guide.map-compass.tip.1':
    '罗盘只在 MapLibre GL 和 Mapbox GL 地图上有；Leaflet 地图不能转动，所以没有罗盘。“设置”里“地图”下的“地图提供商”决定你用哪一个，“保存地图”保留这个选择。',
  'help.guide.map-compass.tip.2':
    '点击同时也去掉倾斜：右键上下拖动会让视角俯仰，“Reset north”在回正的同时把它放平。在 Mapbox GL 上开着“3D 建筑和地形”时，这也会把 3D 视图压平，直到你再次倾斜。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': '协作',
  'help.ctx.trip-collab.summary':
    '群组一起规划的标签页：左边是“聊天”，旁边是共享的“笔记”和“链接”，它们下面是“投票”，最后是“接下来”。这里写下的一切都会同时出现在其他每位成员的屏幕上，不用刷新。',
  'help.ctx.trip-collab.bullet.1':
    '“聊天”是左边那一栏。在“输入消息...”里写字并按 Enter；Shift 加 Enter 换行。笑脸添加表情符号，“附加图片”给消息挂上最多四张图片。',
  'help.ctx.trip-collab.bullet.2':
    '把鼠标移到一条消息上会出现“回复”，自己的消息上还有“删除”；右键点击它可得到八个快捷反应。删除的消息只留下一行“删除了一条消息”。',
  'help.ctx.trip-collab.bullet.3':
    '“笔记”是共享的记事本：“新建笔记”写一条，旁边的齿轮打开“管理分类”，处理分类的名称和颜色。卡片上带着“展开”“置顶”“编辑”和“删除”。',
  'help.ctx.trip-collab.bullet.4':
    '“链接”收集旅行赖以运转的网址。“添加链接”接受一个标题和一个 http 或 https 地址；“编辑链接”“固定链接”和“删除链接”在小块的尾部，固定过的链接留在最前面。',
  'help.ctx.trip-collab.bullet.5':
    '“投票”用来拍板。“新建投票”提一个问题，至少配两个选项；点一下某个选项就是你的一票，“关闭”结束投票，“删除”移除这个投票。',
  'help.ctx.trip-collab.bullet.6':
    '“接下来”列出旅行中还在前面的停靠点，最多八个，连同它们的时间和参与的人。它只读取当天的计划；时间在那里设置。',
  // write-note
  'help.guide.write-note.title': '写一条共享笔记',
  'help.guide.write-note.goal': '把整个群组都需要的东西，一条规矩、一个地址、一个提醒，放在人人都能再找到的地方。',
  'help.guide.write-note.step.1': '点击“笔记”面板顶部的“新建笔记”。表单打开。',
  'help.guide.write-note.step.2':
    '“笔记标题”是卡片带的名字。它是表单唯一坚持要的东西：里面没有内容，“创建”就一直是灰的。',
  'help.guide.write-note.step.3':
    '它下面的大框放正文，接受 Markdown：一个粗体词、一个列表、一个标题。卡片显示开头几行，卡片上的“展开”打开整条笔记。',
  'help.guide.write-note.step.4':
    '在“分类”下面选这条笔记所属的那一个；它的颜色成为卡片的颜色。那些药丸形状的是已经存在的分类，新分类在“管理分类”里建。',
  'help.guide.write-note.step.5': '“网站”接受一个属于这条笔记的链接。卡片随后会带一个打开它的 Link 方块。',
  'help.guide.write-note.step.6': '点击“创建”。',
  'help.guide.write-note.result':
    '笔记成为“笔记”面板里的一张卡片，带着所属分类的颜色，并且已经在其他每位成员的屏幕上。',
  'help.guide.write-note.tip.1': '卡片上的“置顶”把它留在面板最上面；它下面的一切按最后修改时间排序。',
  'help.guide.write-note.tip.2':
    '“新建笔记”旁边的齿轮打开“管理分类”：在那里给分类配颜色，一次性在所有地方改名，或者在任何笔记用到它之前就先建好。',
  'help.guide.write-note.tip.3':
    '“附加文件”给笔记挂上一份文档。“附加”打开文件选择器，图片或 PDF 也可以直接粘贴进表单。',
  'help.guide.write-note.tip.4':
    '“笔记”在“扩展”下面、“协作”之下有自己的开关：管理员可以把它关掉，让“聊天”“链接”“投票”和“下一步”继续运行。',
  // shared-links
  'help.guide.shared-links.title': '收集旅行的链接',
  'help.guide.shared-links.goal': '把预订门户、共享相册和时刻表放在一处，不必再翻聊天记录去找它们。',
  'help.guide.shared-links.step.1': '点击“链接”面板顶部的“添加链接”。',
  'help.guide.shared-links.step.2': '在“链接标题”里给链接起个名字，把网址粘进它下面的字段，然后点击“保存链接”。',
  'help.guide.shared-links.step.3': '小块显示名字和它指向的站点。点一下就在新标签页里打开那个页面。',
  'help.guide.shared-links.step.4':
    '它尾部的三个小按钮是“编辑链接”“固定链接”和“删除链接”。“固定链接”把小块挪到面板最前面；“删除链接”什么也不问。',
  'help.guide.shared-links.result': '链接成为“链接”面板里的一个小块，固定在最前面，并且同时出现在每位成员的屏幕上。',
  'help.guide.shared-links.tip.1': '只接受 http 和 https 地址；别的东西，字段在保存之前就拒绝。',
  'help.guide.shared-links.tip.2':
    '固定的链接排在前面，然后是最新的。标题旁边的小图标是站点自己的网站图标，从站点本身取来，所以没有网络时小块改为显示一个普通的链接符号。',
  'help.guide.shared-links.tip.3':
    '“链接”在“扩展”下面、“协作”之下有自己的开关，所以管理员可以关掉这个面板而不动标签页的其余部分。',
  // create-poll
  'help.guide.create-poll.title': '问问群组',
  'help.guide.create-poll.goal': '把聊天里没人回答的问题，变成人人都能勾选的投票。',
  'help.guide.create-poll.step.1': '点击“投票”面板顶部的“新建投票”。',
  'help.guide.create-poll.step.2': '写下问题。框下面的“支持 Markdown”意思是粗体词、换行或者短列表在这里都管用。',
  'help.guide.create-poll.step.3': '填写“选项 1”和“选项 2”。两个有内容的选项是最低要求。',
  'help.guide.create-poll.step.4': '“+ 添加选项”加上第三个、第四个，要多少加多少；某一行旁边的小叉子再把一个去掉。',
  'help.guide.create-poll.step.5': '“多选”让每个人都能勾选不止一个选项。保持关闭时，有人改选别的，票就转过去。',
  'help.guide.create-poll.step.6': '点击“创建投票”。',
  'help.guide.create-poll.result': '投票立在“投票”面板的最上面，处于开放状态，还没有人投过票。',
  'help.guide.create-poll.tip.1': '问题按 Markdown 渲染；选项保持纯文本。',
  'help.guide.create-poll.tip.2': '在有了一个问题和至少两个有内容的选项之前，“创建投票”一直是灰的。',
  'help.guide.create-poll.tip.3':
    '截止时间只能在手机应用里设置。有截止时间的投票在这里用一个琥珀色小块显示剩余时间，时间一到就算已关闭。',
  'help.guide.create-poll.tip.4':
    '“投票”在“扩展”下面、“协作”之下有自己的开关：管理员可以把它关掉，让另外四个面板继续运行。',
  // vote-poll
  'help.guide.vote-poll.title': '投票并读懂结果',
  'help.guide.vote-poll.goal': '投下你的一票，看看群组的态度，再改变主意。',
  'help.guide.vote-poll.step.1': '点击你想要的选项。它的圆圈被填满，后面的条形随之变长。',
  'help.guide.vote-poll.step.2': '现在整个结果都可读了：条形是占比，百分比在右边，小圆圈是选了那个选项的人。',
  'help.guide.vote-poll.step.3': '改主意了？点击另一个选项。在没有“多选”的投票里，你的票会转过去，而不是再加一票。',
  'help.guide.vote-poll.step.4':
    '问题下面写着这个投票有多少票。点一下你已经选过的选项就把你的票撤回来，计数也跟着降下去。',
  'help.guide.vote-poll.result': '你的勾在一个选项上，条形显示群组怎样分开，圆圈说明谁选了什么。',
  'help.guide.vote-poll.tip.1':
    '条形和百分比只有在你自己投过票之后，或者投票关闭之后才出现，这样没人会被当前的票势影响。',
  'help.guide.vote-poll.tip.2': '投票从不匿名：把鼠标移到某个选项上的一个圆圈上，就能看到它背后的名字。',
  // close-poll
  'help.guide.close-poll.title': '关闭一个投票，或者移除它',
  'help.guide.close-poll.goal': '群组做出决定后停止投票，并清掉已经没人需要的投票。',
  'help.guide.close-poll.step.1': '“关闭”，也就是投票角上的那把锁，结束投票。选项不再接受点击。',
  'help.guide.close-poll.step.2':
    '关闭的投票沉到面板底部的“已关闭”标题下面，戴上“已关闭”徽章，并向所有人显示结果，无论他们投没投票。胜出的选项染成绿色。',
  'help.guide.close-poll.step.3': '同一个角上的垃圾桶“删除”移除这个投票。没有任何二次询问，票也一起消失。',
  'help.guide.close-poll.result': '投票从每位成员的面板上消失了。只被你关闭的那个仍然留在底部可读，连同它的结果。',
  'help.guide.close-poll.tip.1': '关闭不能撤销：没有重新开启。误关的投票只能重新再问一次。',
  'help.guide.close-poll.tip.2': '“删除”把这个投票和上面的每一张票，对所有人一并拿走，立刻生效，也不会询问。',
  // whats-next
  'help.guide.whats-next.title': '读懂“接下来”',
  'help.guide.whats-next.goal': '不用打开计划，就看到群组接下来要做什么。',
  'help.guide.whats-next.step.1':
    '这个面板按时间顺序列出旅行中还在前面的停靠点，最多八个，每天一个标题：“今天”“明天”或者日期。',
  'help.guide.whats-next.step.2':
    '一行的左边立着它的时间：开始时间、“至”，以及停靠点有结束时间时的结束时间；还没有给它设置时间时则是 TBD。',
  'help.guide.whats-next.step.3': '名字下面的小块是这个停靠点上的人。如果没有给它选人，旅行里的每个人都会列出来。',
  'help.guide.whats-next.result': '一份即将到来的清单，只供阅读：它跟着计划走，这里的任何东西都不会改动计划。',
  'help.guide.whats-next.tip.1': '这里什么也不设置。时间来自当天的计划；在那里改动，这份清单立刻跟上。',
  'help.guide.whats-next.tip.2': '只列出还在前面的：时间已过的停靠点会掉出去，旅行到了尾声，面板就是空的。',
  'help.guide.whats-next.tip.3':
    '“下一步”在“扩展”下面、“协作”之下有自己的开关，而且它是桌面端的面板：手机应用的“协作”标签页里没有它。',
  // trip-chat
  'help.guide.trip-chat.title': '和群组说话',
  'help.guide.trip-chat.goal': '说点什么，回答某一条特定的消息，对另一条做出反应，再把自己的收回来。',
  'help.guide.trip-chat.step.1':
    '在“输入消息...”里写字并按 Enter。框旁边的蓝色箭头做同样的事；Shift 加 Enter 则是换行。',
  'help.guide.trip-chat.step.2':
    '笑脸打开表情选择器，里面有 Smileys、Reactions 和 Travel。你选中的会加进正在写的内容里，它不会自己发出去。',
  'help.guide.trip-chat.step.3': '把鼠标移到别人的消息上：角落会出现一个小圆按钮。那就是“回复”。',
  'help.guide.trip-chat.step.4':
    '你要回答的消息会被引用在输入框上方。写好并发送，引用就跟着进入你的气泡；引用上的叉子再把它去掉。',
  'help.guide.trip-chat.step.5': '右键点击一条消息可得到八个快捷反应。你的反应待在气泡下面，再点一次同一个就收回。',
  'help.guide.trip-chat.step.6':
    '你自己的消息在“回复”旁边带着“删除”。它把消息拿走，只留下一行“删除了一条消息”：没有回头路。',
  'help.guide.trip-chat.result':
    '你的回答待在它引用的那条消息下面，一个反应挂在第三条上，被你收回的那条只留下一行说明。',
  'help.guide.trip-chat.tip.1': 'Enter 发送，Shift 加 Enter 换行。整条只有表情符号的消息会放大显示。',
  'help.guide.trip-chat.tip.2': '“附加图片”一条消息最多收四张图片；图片也可以直接粘贴或拖放到框里。',
  'help.guide.trip-chat.tip.3':
    '带链接的消息下面会有一张预览卡片，由你自己的 TREK 取回，所以指向只有你能访问的东西的链接，仍然只是一个普通链接。',
  'help.guide.trip-chat.tip.4':
    '“聊天”在“扩展”下面、“协作”之下有自己的开关：管理员可以把它关掉，让“笔记”“链接”“投票”和“下一步”继续运行。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '列表',
  'help.ctx.trip-lists.summary':
    '一次旅行的两份清单：行李清单，记下谁带什么、有多重；还有待办清单，记下出发前和旅途中必须发生的每一件事。只要“列表”扩展开着，这个标签页就在。',
  'help.ctx.trip-lists.bullet.1':
    '顶部的“行李清单”和“待办事项”在两者之间切换，并各自数出里面有多少；右边的按钮属于当前打开的那一边。',
  'help.ctx.trip-lists.bullet.2':
    '行李清单按清单分组，证件、衣物，随你怎么叫，每份清单带一个颜色圆点、一个已打包/总数的徽章，以及装着“重命名”“全部勾选”“取消全部勾选”和“删除清单”的三个点。上方工具栏里的“添加清单”新建一份。',
  'help.ctx.trip-lists.bullet.3':
    '一行是一个勾选框和一个名称，然后是谁带它、数量和以克计的重量这几个小徽章，以及行李圆圈（在“行李追踪”开着时），再是垃圾桶和装着“移动到清单”“共享”“重命名”和“删除”的三个点。一行没用到的部分会保持淡色，直到你把指针移上去；左边的抓手把它在所属清单里上下拖动。',
  'help.ctx.trip-lists.bullet.4':
    '“共享”和“我的清单”把行李清单一分为二：所有人都看得到的公共池，和你自己的那份。“全部”“未完成”“已完成”收窄当前打开的那一边，上方的进度条数出已经打包了多少。',
  'help.ctx.trip-lists.bullet.5':
    '“应用模板”和“保存为模板”不用一条条敲就能填满或留下一份清单，旁边的两个图标把清单导出为打印件、PDF 或文件，也能导入一份。进度条旁边的红色按钮写出有多少物品已勾选，并把它们清走。',
  'help.ctx.trip-lists.bullet.6':
    '“待办事项”有自己的侧栏：进度卡片，“全部”“我的任务”“已逾期”“已完成”几个筛选，每份清单一行，下面是“添加清单”。任务放在一张卡片里，卡片的标题栏写着筛选名称，并带有排序：“优先级”或“截止日期”。点击一个任务会在右侧面板里打开它，“新建任务”则在屏幕中央打开“新任务”表单。',
  // packing-categories
  'help.guide.packing-categories.title': '搭建行李清单',
  'help.guide.packing-categories.goal': '把要带的东西归进清单，填上物品，并说明谁来负责每一份清单。',
  'help.guide.packing-categories.step.1':
    '点击清单上方工具栏里的“添加清单”，在“清单名称（例如：衣物）”里输入名称，然后点击“添加”。',
  'help.guide.packing-categories.step.2':
    '新清单以一个空行开始。点击“添加物品”，在“物品名称...”里输入物品并按 Enter；输入框会一直开着，等下一个。',
  'help.guide.packing-categories.step.3': '点击一行的名称给它改名，或者用它右端三个点里的“重命名”。',
  'help.guide.packing-categories.step.4':
    '清单标题里的虚线圆圈把旅行成员分配到这份清单。选一个名字；出现的标签再点一下就把那个人移除。',
  'help.guide.packing-categories.step.5':
    '标题末尾的三个点装着其余的：“重命名”“全部勾选”“取消全部勾选”，以及“删除清单”，它会连清单带里面的一切一起拿走，不再问第二遍。',
  'help.guide.packing-categories.result':
    '新清单排在网格里，物品在它下面，带着自己的颜色圆点，徽章数出已经打包了多少。',
  'help.guide.packing-categories.tip.1':
    '一份清单就是它的物品。删掉最后一个，那一行会变成占位行，好让清单保住位置和颜色；把那一行也删掉，清单就没了。',
  'help.guide.packing-categories.tip.2':
    '把某人分配到一份清单会给他发一条行李通知。这不会改变谁能看到这些物品，那是一行的三个点里的“共享”。',
  'help.guide.packing-categories.tip.3': '两份清单可以同名。TREK 在内部区分它们，所以名字保持你输入的样子。',
  // check-off-packing
  'help.guide.check-off-packing.title': '一边收拾一边打勾',
  'help.guide.check-off-packing.goal': '标记已经进包的东西，看着进度条，再把打包好的物品清走。',
  'help.guide.check-off-packing.step.1': '点击一行左边的方框。名称被划掉，进度条往前走。',
  'help.guide.check-off-packing.step.2': '上方的进度条把已打包的数量对着清单上的全部来数，既给数字也给百分比。',
  'help.guide.check-off-packing.step.3': '整份清单一次搞定：它标题里的三个点装着“全部勾选”和“取消全部勾选”。',
  'help.guide.check-off-packing.step.4':
    '“全部”“未完成”“已完成”收窄网格。“未完成”只留下还缺的东西，所以已经装齐的清单会从里面消失。',
  'help.guide.check-off-packing.step.5':
    '进度条旁边的“移除 3 个已勾选”在浏览器确认一次之后，把所有已勾选的物品一次删掉。',
  'help.guide.check-off-packing.result': '列出的只剩还没完成的，上方的进度条说出打包进行到哪一步。',
  'help.guide.check-off-packing.tip.1': '已勾选的物品仍然可以改名：点击它的名称。',
  'help.guide.check-off-packing.tip.2':
    '“全部勾选”和“取消全部勾选”一次只对一份清单起作用，要从那份清单自己的三个点里用。',
  'help.guide.check-off-packing.tip.3': '当每个物品都勾上时，计数会被“全部打包完成！”取代，进度条变绿。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '应用行李模板',
  'help.guide.apply-packing-template.goal': '把一份现成的清单带进旅行，并把这次旅行的清单留给下一次。',
  'help.guide.apply-packing-template.step.1': '点击清单上方工具条里的“应用模板”。',
  'help.guide.apply-packing-template.step.2': '挑一个模板。每一行写出它的名字和里面有多少物品。',
  'help.guide.apply-packing-template.step.3':
    '物品落在你当前所在的视图里：“共享”把它们放进所有人都看得到的公共池，“我的清单”让它们归你。',
  'help.guide.apply-packing-template.step.4':
    '把这次旅行的清单留给下次旅行：“保存为模板”会打开一个对话框，输入名字后点击“保存”。',
  'help.guide.apply-packing-template.result': '模板的清单和物品已经在旅行里，就挨着原来就有的东西。',
  'help.guide.apply-packing-template.tip.1': '模板只带名称和清单。数量、重量、行李和已经勾选的状态都留在原地。',
  'help.guide.apply-packing-template.tip.2': '只有存在模板时才有“应用模板”。一个都没有的话，这个按钮根本不出现。',
  'help.guide.apply-packing-template.tip.3':
    '“保存为模板”只对实例管理员出现，而且只在清单里有物品时出现。它保存共享池加上你自己的物品，绝不会保存别的成员的私人物品。',
  // import-packing-list
  'help.guide.import-packing-list.title': '整份行李清单粘贴进来',
  'help.guide.import-packing-list.goal': '把你已经放在别处的一份清单，一次性变成行李物品。',
  'help.guide.import-packing-list.step.1': '点击清单上方工具条里带向下箭头的导入按钮。',
  'help.guide.import-packing-list.step.2':
    '每行一个物品：类别, 名称, 以克计的重量（可选）, 行李（可选）, checked/unchecked（可选）。框里的灰色示例把四种写法都展示了。Markdown 列表也可以：标题就是清单名，"- [ ]" 和 "- [x]" 会变成物品。',
  'help.guide.import-packing-list.step.3':
    '或者用“加载 CSV/TXT/MD”从文件里读入这些行。它接受 .csv、.txt 或 .md 文件，并替换掉框里的内容。',
  'help.guide.import-packing-list.step.4': '点击“导入”。按钮会数出它读懂了多少行。',
  'help.guide.import-packing-list.result':
    '每一行都成了一条物品，落在它第一个字段指定的清单里，原来就有的东西一点没动。',
  'help.guide.import-packing-list.tip.1':
    '逗号、分号和制表符都能分隔字段，双引号把一个字段拢在一起，所以“Shirt, blue”还是一个名称。只有一个值的行就只是一个名称，没有自己清单的行落进“其他”，名称前的 "3x" 设定数量。',
  'help.guide.import-packing-list.tip.2':
    '第四个字段里点名的行李，如果旅行里还没有就会被创建。这是唯一一处能批量载入重量和行李的地方；模板只带来名称和清单。',
  // export-packing-list
  'help.guide.export-packing-list.title': '打印或导出行李清单',
  'help.guide.export-packing-list.goal': '把清单带走：印在纸上、存成 PDF，或者存成文件，给别的应用或下次旅行用。',
  'help.guide.export-packing-list.step.1': '点击清单上方工具条里带向上箭头的导出按钮。',
  'help.guide.export-packing-list.step.2': '“Markdown 清单 (.md)”和“用于导入的 CSV (.csv)”会直接把清单保存为文件。',
  'help.guide.export-packing-list.step.3':
    '点击“打印或另存为 PDF”。预览把清单排成一页：顶部是旅行和日期，下面每份清单是一张带勾选框的卡片。',
  'help.guide.export-packing-list.step.4':
    '点击预览下方的“打印或另存为 PDF”。浏览器会打开打印对话框：选一台打印机，或选“另存为 PDF”保存成文件。',
  'help.guide.export-packing-list.result':
    '打印件和文件包含当前打开的视图，即“共享”或“我的清单”，连同数量、重量和勾选状态。',
  'help.guide.export-packing-list.tip.1':
    'CSV 正是“导入”读取的格式，连行李也包括在内，所以可以当作你自己的行李模板：导入到下一次旅行里即可。',
  'help.guide.export-packing-list.tip.2':
    'Markdown 文件在 Obsidian、Notion 或 GitHub 里会显示为勾选清单，也同样可以通过“导入”再导回来。',
  // share-packing-item
  'help.guide.share-packing-item.title': '决定谁看得到一件物品、谁来带',
  'help.guide.share-packing-item.goal': '把一件物品在小组公共池、你自己的清单和你替他们带的人之间挪来挪去。',
  'help.guide.share-packing-item.step.1':
    '清单上方的“共享”是所有人都看得到的公共池，“我的清单”是你自己的，两边各自数出里面有多少。点击“我的清单”看你自己的。',
  'help.guide.share-packing-item.step.2': '回到“共享”，打开一行末尾的三个点，点击“共享”。',
  'help.guide.share-packing-item.step.3':
    '一共三档：“共享”，在小组公共池里，所有人可见；“个人”，只有你看得到；还有“共享给…”，在那里挑出这件物品覆盖到的人。',
  'help.guide.share-packing-item.step.4': '“个人”的物品只在“我的清单”里。切过去才找得到。',
  'help.guide.share-packing-item.step.5':
    '再打开一次“共享”，在“共享给…”下面勾一个名字。这件物品也会出现在那个人的清单上，行上会多出一个小徽章，数着它共享给了几个人。',
  'help.guide.share-packing-item.result': '物品落在你选的那一档里，行上写着谁来带它。',
  'help.guide.share-packing-item.tip.1':
    '只有带这件物品的人才能改它的共享。被你分享到的人会在自己的“我的清单”上看到它，旁边标着你的名字，并且可以把它勾掉。',
  'help.guide.share-packing-item.tip.2':
    '在别人带的物品上，你拿到的是另外两个按钮：“我也可以带”，把你加到他旁边；还有“复制到我的清单”，给你自己做一份私人副本。',
  'help.guide.share-packing-item.tip.3':
    '新物品继承你添加它时所在的视图。在“我的清单”里加的是“个人”，在“共享”里加的进公共池。',
  // packing-bags
  'help.guide.packing-bags.title': '给行李称重',
  'help.guide.packing-bags.goal': '给每件物品写上重量，把物品分进各件行李，并让每件行李都不超航空公司的限额。',
  'help.guide.packing-bags.step.1': '点击圆圈前面的重量徽章，输入物品以克为单位的重量。',
  'help.guide.packing-bags.step.2': '行末的圆圈就是它的行李。点它。',
  'help.guide.packing-bags.step.3': '还没有行李：“添加行李”，一个名字，Enter。行李被创建，物品直接进去。',
  'help.guide.packing-bags.step.4':
    '只要存在一件行李，右侧就出现“行李”面板：名称、重量、一条填充条、谁来背、里面有多少物品，然后是“未分配”和“总重量”。',
  'help.guide.packing-bags.step.5': '点击“设置限制”，按航空公司的说法用千克输入限额。',
  'help.guide.packing-bags.step.6': '行李名字旁边的虚线加号说明谁来背它。',
  'help.guide.packing-bags.result':
    '右侧的“行李”面板把每件行李的重量对着它的限额显示出来，还有不在任何行李里的东西，以及总计。',
  'help.guide.packing-bags.tip.1':
    '重量输入框、行李圆圈和“行李”面板，只有在管理员于“列表”扩展下打开了“行李追踪”时才存在。',
  'help.guide.packing-bags.tip.2':
    '一件行李的重量是在服务器上把每位成员的物品加起来的，包括你看不到的那些，所以这个数字真的就是这件行李的重量。',
  'help.guide.packing-bags.tip.3':
    '没有限额的行李按最重的那件来画，好让各条进度条仍然可比。给它一个限额，进度条就改成按那个来读。',
  // create-todo
  'help.guide.create-todo.title': '添加一个任务',
  'help.guide.create-todo.goal': '把必须发生的事记下来，配上清单、优先级、日期和负责人。',
  'help.guide.create-todo.step.1': '点击右上角的“新建任务”。',
  'help.guide.create-todo.step.2': '在“任务名称”里给它起名，把值得记住的内容写在“描述”下面。',
  'help.guide.create-todo.step.3': '“清单”把任务归类。选一个，或者用旁边的加号在一个小对话框里给新清单起名。',
  'help.guide.create-todo.step.4': '“优先级”是四个按钮：“无”、P1、P2 和 P3，从红到蓝。',
  'help.guide.create-todo.step.5': '“截止日期”打开一个日历，“分配给”给任务写上一个名字。',
  'help.guide.create-todo.step.6': '点击“创建任务”。',
  'help.guide.create-todo.result':
    '任务已经在列表里，带着它的徽章：优先级、截止日期、清单和被分配的人，并且在右侧面板里打开。',
  'help.guide.create-todo.tip.1': '只有名称是必填的。其余的都可以之后从右侧面板补上。',
  'help.guide.create-todo.tip.2': '侧栏里选中了某份清单时，新任务就从那份清单开始。',
  'help.guide.create-todo.tip.3': '在名称框里按 Enter 会直接创建任务，不用碰其他字段。',
  // todo-filters
  'help.guide.todo-filters.title': '找到并修改一个任务',
  'help.guide.todo-filters.goal': '把任务列表削到眼下要紧的部分，再编辑你落到的那个任务。',
  'help.guide.todo-filters.step.1':
    '侧栏里的“任务”：“全部”是所有还没完成的，“我的任务”是落在你身上的，“已逾期”是日期已经过去的，“已完成”是做完的。每一项都带着自己的数字；点击“已逾期”。',
  'help.guide.todo-filters.step.2': '“清单”下面每份清单一行。选中一行就显示那份清单，连已完成的任务也在内。',
  'help.guide.todo-filters.step.3':
    '清单标题栏里的排序会重新排列屏幕上的内容：“优先级”把 P1 放最前，“截止日期”把最近的期限放最前。两者一次只能用一个，再点一次就回到你自己的顺序。',
  'help.guide.todo-filters.step.4': '点击一个任务，在右侧面板里打开它。',
  'help.guide.todo-filters.step.5':
    '改你需要改的，“描述”“优先级”“清单”“截止日期”或“分配给”，然后“保存更改”。面板标题栏里的复选框把任务勾为完成，“删除”立刻把它删掉。',
  'help.guide.todo-filters.result': '列表只显示你要的任务，右侧面板编辑你选中的那一个。',
  'help.guide.todo-filters.tip.1':
    '清单那一行只数还没完成的，但选中它连已完成的任务也会显示。“全部”“我的任务”和“已逾期”藏起做完的；“已完成”则只显示做完的。',
  'help.guide.todo-filters.tip.2':
    '排序里的“优先级”和“截止日期”互相排斥，而且只要其中一个开着，行就不能再拖成你自己的顺序了。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '预订',
  'help.ctx.trip-bookings.summary':
    '这一栏装着旅行中除交通之外预订的一切：住的地方、餐位、门票、旅游团、停车。每条预订都是“待确认”或“已确认”里的一张卡片，带着它的预订码、单据、出行人和费用。',
  'help.ctx.trip-bookings.bullet.1':
    '右上角的“手动添加”打开表单。它能做出的六类是“住宿”“餐厅”“活动”“旅游团”“停车”和“其他”；航班、火车之类在“交通”栏里，绝不会出现在这里。',
  'help.ctx.trip-bookings.bullet.2':
    '“从文件导入”把一份预订确认交给解析：EML、PDF、PKPass、HTML 或 TXT，最多 5 个文件，每个不超过 10 MB。只有服务器能读它们时，这个按钮才在。',
  'help.ctx.trip-bookings.bullet.3':
    '标题旁的筛选片按类型筛选，每片带着自己的数量，“全部”把一切带回来。一旦有预订指定了人，筛选片旁边那一排头像就能把这一栏收窄到其中一个人。',
  'help.ctx.trip-bookings.bullet.4':
    '卡片分在两个区里，“待确认”和“已确认”，各带自己的数量。点击区标题会把它折起来，是否展开会为这次旅行记住。',
  'help.ctx.trip-bookings.bullet.5':
    '一张卡片带着状态圆点、类型、标题、日期和时间、“预订码”、“地点 / 地址”、这条预订关联到什么、它的“链接”、“备注”、“文件”和“出行人”。',
  'help.ctx.trip-bookings.bullet.6':
    '卡片上的铅笔再次打开同一个表单；垃圾桶问一次，然后这条预订就没了。若是住宿，它在日程计划里的住宿日和关联的支出会一并消失。',
  // create-booking
  'help.guide.create-booking.title': '创建一条预订',
  'help.guide.create-booking.goal': '把一家餐厅、一场活动、一个旅游团、一个车位或别的什么，手动放进这次旅行。',
  'help.guide.create-booking.step.1': '点击这一栏右上角的“手动添加”。“新建预订”打开。',
  'help.guide.create-booking.step.2':
    '从表单顶部“出行人”旁边的列表里选“预订类型”。这一栏做的六类是“住宿”“餐厅”“活动”“旅游团”“停车”和“其他”，表单随选择而变：只有“住宿”会把日期换成一段日子的范围。',
  'help.guide.create-booking.step.3': '填“标题”。这是表单唯一坚持要的字段，在它有内容之前“添加”一直是灰的。',
  'help.guide.create-booking.step.4':
    '设置“日期”和“开始时间”，如果这条预订有结束，再设“结束日期”和“结束时间”。日历只给出旅行之内的日子；结束不晚于开始时，会用红色这样提示并挡住“添加”。',
  'help.guide.create-booking.step.5':
    '填入确认单上的“预订码”，并设置“状态”。是“待确认”还是“已确认”，决定卡片落进两个区中的哪一个。',
  'help.guide.create-booking.step.6': '点击“添加”。',
  'help.guide.create-booking.result':
    '这条预订成了它那个区里的一张卡片，带着类型筛选片、日期和预订码，旅行中其他所有人也会看到它出现。',
  'help.guide.create-booking.tip.1':
    '“地点 / 地址”在你输入时给出真实地址；选中一个会替换你写下的内容，而你自己输入的地址会原样保留。',
  'help.guide.create-booking.tip.2': '“链接”放的是这条预订在服务商那里的页面。卡片会把它变成一个在新标签页打开的链接。',
  'help.guide.create-booking.tip.3': '“备注”是 Markdown，所以一个列表或一行加粗在卡片上也照样呈现。',
  // booking-hotel
  'help.guide.booking-hotel.title': '预订一个住的地方',
  'help.guide.booking-hotel.goal': '录入一处住宿，让它同时算作一条预订和日程计划里的若干夜。',
  'help.guide.booking-hotel.step.1': '点击“手动添加”并选“住宿”。日期字段消失，一组住宿字段接替它们的位置。',
  'help.guide.booking-hotel.step.2':
    '在“住宿”下选酒店。列表是这次旅行自己的地点，选中一个会把它的名称写进“标题”，地址写进“地点 / 地址”。',
  'help.guide.booking-hotel.step.3':
    '设置“从”和“到”：第一晚，以及离开的那个早上。两者都给出旅行的日子及其日期，而且二者会彼此保持先后顺序。',
  'help.guide.booking-hotel.step.4': '填写“入住”“入住截止”“退房”，以及确认单上的“预订码”。',
  'help.guide.booking-hotel.step.5': '点击“添加”。',
  'help.guide.booking-hotel.result':
    '卡片带的不是一个日期而是一段日子的范围，附上入住和退房时间以及地址；同一段住宿现在也落在计划的那些日子上。',
  'help.guide.booking-hotel.tip.1':
    '“住宿”是唯一没有“日期”和“开始时间”的类型。它的日期是“从”和“到”，而且是旅行的日子，不是日历。',
  'help.guide.booking-hotel.tip.2': '也可以让“住宿”空着，改为输入地址：这个地点会被查出来、建好，并替你钉在地图上。',
  'help.guide.booking-hotel.tip.3': '删除这条预订，会把日程计划里的那些夜一并带走。',
  // link-booking
  'help.guide.link-booking.title': '把一条预订系到计划上',
  'help.guide.link-booking.goal': '把一条预订挂到它所属的那一站和那个地点上，好让它出现在你会需要它的地方。',
  'help.guide.link-booking.step.1': '点击你想关联的那张卡片上的铅笔。“编辑预订”打开。',
  'help.guide.link-booking.step.2':
    '打开“关联日程分配”。列表就是你的计划：每天一个标题，下面是那天的各站，带编号和时间。选中这条预订所属的那一站。',
  'help.guide.link-booking.step.3':
    '“地点 / 活动”关联的是地点本身。在那里选中它，凡是你留空的“标题”和“地点 / 地址”都会被填上。',
  'help.guide.link-booking.step.4': '点击“更新”。',
  'help.guide.link-booking.result': '卡片在“关联日程分配”下写出那一天和那一站，这条预订也在日程计划里跟着那一站走。',
  'help.guide.link-booking.tip.1':
    '列表顶部的“无关联（独立）”再次取消关联。“住宿”根本没有选站的地方：它通过自己的住宿日来关联。',
  'help.guide.link-booking.tip.2': '选中某个有日期的日子上的一站，会替你填上空着的“日期”。你已经设过的日期不会被动。',
  // booking-travelers
  'help.guide.booking-travelers.title': '说明一条预订是给谁的',
  'help.guide.booking-travelers.goal': '标出一条预订涵盖的出行人，然后只看他们的。',
  'help.guide.booking-travelers.step.1':
    '用铅笔打开这条预订。“出行人”在表单顶部，“预订类型”旁边，只要这条预订上还没有人，它就显示“分配出行人”。',
  'help.guide.booking-travelers.step.2':
    '点它，选出这条预订是给谁的那些人；有名字的“访客”也在列表里。被选中的人会得到一个勾，头像也会出现在这个字段中。再点一次名字就取消。',
  'help.guide.booking-travelers.step.3': '点击“更新”。',
  'help.guide.booking-travelers.step.4': '在上方工具栏里，类型筛选片旁边，点击某位出行人的头像，就只看他的预订。',
  'help.guide.booking-travelers.result': '卡片列出它是给谁的那些人，而头像那一排把这一栏收窄到其中一个人。',
  'help.guide.booking-travelers.tip.1': '在卡片上，出行人只是显示，永远改不了。要设置就在这里，在表单里。',
  'help.guide.booking-travelers.tip.2':
    '头像那一排要等这次旅行不止一位成员、且至少有一条预订指定了某人时才出现。你选的内容在这个浏览器会话里一直有效。',
  // booking-files
  'help.guide.booking-files.title': '把凭证和预订放在一起',
  'help.guide.booking-files.goal': '把确认单、票或通行证附到它所属的那条预订上。',
  'help.guide.booking-files.step.1':
    '用铅笔打开这条预订，往下到“文件”，点击“附加文件”。在一条已经存在的预订上，单据会立刻上传，TREK 会说“文件已上传”。',
  'help.guide.booking-files.step.2': '单据按名称列出，带一个打开它的按钮，旁边还有一个 X。',
  'help.guide.booking-files.step.3':
    '“关联已有文件”给出这次旅行中还不在这条预订上的单据。选中一个，它就被附上，不必再上传一次。',
  'help.guide.booking-files.step.4': '点击“更新”。',
  'help.guide.booking-files.result': '卡片在“文件”下列出这些单据，点击其中一个就能打开。',
  'help.guide.booking-files.tip.1': '在一条你还在创建的预订上，单据会等着，在你点“添加”的那一刻上传。',
  'help.guide.booking-files.tip.2': '单据旁的 X 去掉的是关联，不是单据本身。它仍留在这次旅行的“文件”栏里。',
  'help.guide.booking-files.tip.3':
    '哪些种类的文件可以附加，取决于管理员的“允许的文件类型”清单；开箱即用地允许文档、文本和图片。',
  // booking-cost
  'help.guide.booking-cost.title': '把一条预订的金额变成费用',
  'help.guide.booking-cost.goal': '把一条预订花掉的钱记进“费用”，并在付钱的人之间分摊。',
  'help.guide.booking-cost.step.1':
    '打开这条预订，走到表单底部。“费用”下面是“创建支出”和“关联已有支出”，附带那行说明“先保存预订，然后打开费用编辑器。”',
  'help.guide.booking-cost.step.2': '点击“创建支出”。预订被保存，它的表单关上，费用编辑器打开。',
  'help.guide.booking-cost.step.3': '“这笔花在哪了？”已经是这条预订的标题。填入“总金额”，并核对“货币”和“日期”。',
  'help.guide.booking-cost.step.4': '“分类”是预订类型推出来的那一个。设置“谁支付的？”以及金额怎么“分摊”。',
  'help.guide.booking-cost.step.5': '点击“添加支出”。',
  'help.guide.booking-cost.result':
    '这条预订的表单现在在“已关联支出”下列出这笔支出和它的金额，同一笔支出也立在“费用”栏里，系在这条预订上。',
  'help.guide.booking-cost.tip.1':
    '分类跟着类型走：“餐厅”变成“餐饮”，“住宿”变成“住宿”，“停车”变成“停车”，“活动”和“旅游团”都落进“其他”。',
  'help.guide.booking-cost.tip.2':
    '一条预订可以带多笔支出。“关联已有支出”会列出“费用”里还不属于任何地方的支出。在已关联的一笔上，“取消关联，保留支出”会解开关联并把它留在“费用”里，而垃圾桶会把它移除。',
  'help.guide.booking-cost.tip.3': '只有在“费用”扩展开着时，“费用”才在表单里，管理员在“扩展”下切换它。',
  // filter-bookings
  'help.guide.filter-bookings.title': '找到一条预订',
  'help.guide.filter-bookings.goal': '把一长栏收窄到你要的类型、人或状态。',
  'help.guide.filter-bookings.step.1': '标题旁的筛选片是这次旅行实际用到的类型，每片带着它所含的数量。“全部”就是整栏。',
  'help.guide.filter-bookings.step.2': '点一片筛选片，只留下那个类型。再点第二片，两个都留下。',
  'help.guide.filter-bookings.step.3': '“全部”把一切放回来。',
  'help.guide.filter-bookings.step.4': '筛选片旁边的头像按出行人筛选，一个人或一次几个人都行。',
  'help.guide.filter-bookings.step.5':
    '“待确认”和“已确认”是那两个区，各带自己的数量。点击一个标题把它折起来；你回来时它仍然是折着的。',
  'help.guide.filter-bookings.result': '这一栏只显示你挑出来的内容，而且在这个浏览器会话里你回来时它仍然那样挑着。',
  'help.guide.filter-bookings.tip.1':
    '筛选片只给出这次旅行有的类型，所以一次连一个旅游团都没有的旅行，就没有“旅游团”这一片。',
  'help.guide.filter-bookings.tip.2':
    '一个什么都匹配不到的筛选，会让这一栏空着，只剩“未找到地点”。措辞是地点列表的；意思是一样的。',
  // import-booking-file
  'help.guide.import-booking-file.title': '从确认单里读出一条预订',
  'help.guide.import-booking-file.goal': '让 TREK 从服务商发来的邮件或 PDF 里把预订取出来，而不必再输一遍。',
  'help.guide.import-booking-file.step.1': '点击工具栏里的“从文件导入”。“导入预订确认”打开。',
  'help.guide.import-booking-file.step.2':
    '把确认单拖放到那个框上，或点击它来挑选：EML、PDF、PKPass、HTML 和 TXT，最多 5 个文件，每个 10 MB。你挑的那些文件的名字会写在框上。',
  'help.guide.import-booking-file.step.3': '点击“导入”。对话框立刻关上，因为读取是在后台进行的。',
  'help.guide.import-booking-file.step.4':
    '右下角的一张卡片在文件名下报告这次运行，它会跟着你走遍应用，也挺得过一次刷新。读取完成后，“正在解析文件…”变成一个对勾，卡片给出“导入”。点击它。',
  'help.guide.import-booking-file.result':
    '这条预订是“待确认”里的一张卡片，带着它的夜数、预订码和“文件”下的确认单，住宿落在计划里的那几天上，而在“费用”开着时，价格是一笔挂在它上面的支出。',
  'help.guide.import-booking-file.tip.1':
    '只有服务器能读预订确认时，“从文件导入”才在，这需要提取器或“AI 解析”扩展二者之一。后者由管理员在“扩展”下切换。',
  'help.guide.import-booking-file.tip.2':
    '如果什么都读不出来，卡片会这样说，并给出“尝试 AI 解析”，它把同样的文件直接送给模型。一次完成的解析会保留十分钟；请在这段时间内开始核对。',
  'help.guide.import-booking-file.tip.3':
    '只有确认单的类型在管理设置的“允许的文件类型”里时，它才会被附上。PDF 开箱即在；邮件，也就是 EML，得先加进去，否则预订保存时不带它。',
  // edit-booking
  'help.guide.edit-booking.title': '修改一条预订',
  'help.guide.edit-booking.goal': '改正一个时间、补上晚到的预订码，或者把一条预订从“待确认”挪到“已确认”。',
  'help.guide.edit-booking.step.1': '点击卡片头部的铅笔。“编辑预订”带着这条预订知道的一切打开。',
  'help.guide.edit-booking.step.2': '改该改的地方，这里是运营商终于发来的那个“预订码”。',
  'help.guide.edit-booking.step.3': '把“状态”设为“已确认”。',
  'help.guide.edit-booking.step.4': '点击“更新”。',
  'help.guide.edit-booking.result':
    '卡片挪了位置：一条已确认的预订立在“已确认”区里，前面是一个绿点，旅行中的每个人都看得到它挪动。',
  'help.guide.edit-booking.tip.1':
    '读不出来的“预订码”，是设置里“显示”下的“隐藏预订编号”。把鼠标停上去，或者点一下，它就清楚了。',
  'help.guide.edit-booking.tip.2': '改了类型，关联支出的分类也跟着改，除非你曾在费用编辑器里手动选过一个分类。',
  'help.guide.edit-booking.tip.3': '住宿也在这里编辑：它的“从”和“到”那两天就在同一个表单里。',
  // delete-booking
  'help.guide.delete-booking.title': '删除一条预订',
  'help.guide.delete-booking.goal': '把一条泡汤的预订从这次旅行里拿掉。',
  'help.guide.delete-booking.step.1': '点击卡片头部的垃圾桶。',
  'help.guide.delete-booking.step.2': '“删除预订？”会说出你选中的那一条，并说明它将被永久删除。',
  'help.guide.delete-booking.step.3': '点击“确认”。',
  'help.guide.delete-booking.result': '卡片没了，对旅行中的所有人都是。预订没有撤销，所以这个问题就是最后一道关。',
  'help.guide.delete-booking.tip.1': '删除一条住宿预订，还会把它在日程计划里的那些夜取走，并移除关联到它的那笔支出。',
  'help.guide.delete-booking.tip.2': '附上过的单据仍留在这次旅行的“文件”栏里；走掉的只是它们与这条预订的关联。',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    '找到的每条预订都会在“新建预订”里逐条打开，内容已填好。对酒店来说，那是“标题”里的名称，旅行里有这个地点时还有“住宿”下的地点，它的“地点 / 地址”，按住宿的夜数填好的“从”和“到”，“入住”和“退房”，“预订码”，“文件”下的确认单，以及在“费用”开着时作为“关联支出”的价格。检查一遍，点击“添加”。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '费用',
  'help.ctx.trip-costs.summary':
    '行程的钱：每一笔支出都是一条带日期的账目，谁垫的钱、谁该分摊，用的是收据上原本的货币；右栏则写明谁该付给谁，才能重新扯平。',
  'help.ctx.trip-costs.bullet.1':
    '顶部四张卡片：“你欠款”和“别人欠你”是你自己这一边的结算，“未结算金额”是已记录但还没有付款人的部分，“行程总支出”把一切加起来，下面带上“你的份额”和“你已支付”。',
  'help.ctx.trip-costs.bullet.2': '右上角的“添加支出”打开编辑器；旁边的“结算”把所有未完成的转账一次全部记下。',
  'help.ctx.trip-costs.bullet.3':
    '账目按日期分组，最新的在前，那一天的合计显示在右侧。每一行带着作为彩色标签的分类、名称、付款人头像、备注和金额，当分摊让你多出或少出时，还会带上“你垫付了”或“你欠了”。',
  'help.ctx.trip-costs.bullet.4':
    '列表上方是“搜索支出…”、一个类别筛选、一个日期筛选、“全部”/“我支付的”/“别人欠我”开关和“导出 CSV”按钮。',
  'help.ctx.trip-costs.bullet.5':
    '右栏就是答案：“结算”列出谁付给谁，“余额”显示每位同行者的盈余或亏空，“最终花费”是这趟行程让他们每个人花了多少，“按分类”则是钱去了哪里。',
  'help.ctx.trip-costs.bullet.6':
    '已记录的付款在同一本账里占着自己的一行，旁边有“编辑”和“撤销”；支出则有一支铅笔和一个垃圾桶，而垃圾桶不问就直接删除。',
  // add-expense
  'help.guide.add-expense.title': '添加一笔支出',
  'help.guide.add-expense.goal': '记下某样东西花了多少、谁付的钱、和谁一起分摊。',
  'help.guide.add-expense.step.1': '点击“费用”标签页右上角的“添加支出”。编辑器打开，日期是今天，所有人已经在分摊里。',
  'help.guide.add-expense.step.2':
    '把这笔钱花在哪写进“这笔花在哪了？”，这是唯一必须填写的字段；把收据上的数字填进“总金额”。',
  'help.guide.add-expense.step.3':
    '“货币”和“日期”在金额下方。“货币”从行程自己的货币开始；改掉它，编辑器就会显示这笔金额折成行程货币是多少。“日期”从今天开始，账目按它把支出归到某一天下。',
  'help.guide.add-expense.step.4':
    '挑一个“分类”。一共十四个，并且不能更改：你挑的那个就是行里的彩色标签，也是“按分类”里的那根柱子。',
  'help.guide.add-expense.step.5':
    '在“谁支付的？”下面，挑出真正掏钱的那个人。“你”是预先选好的；“尚无人支付”只记下金额而不让任何人承担，“多人支付”把这笔账分给几个付款人。',
  'help.guide.add-expense.step.6':
    '“分摊”从“平均分摊”开始，所有人都包含在内，每个名字后面显示分到的份额。点击“添加支出”保存。',
  'help.guide.add-expense.result': '这笔支出进了它那一天的账目，计入“行程总支出”，结算栏也重新算过了谁该付给谁。',
  'help.guide.add-expense.tip.1':
    '保持它打开时的样子：支出用行程的货币，日期是今天，在所有人之间平均分摊，真正必须填的只有名称和金额。',
  'help.guide.add-expense.tip.2': '金额旁边的 ± 把支出变成退款。负的总额是把钱退回来而不是收走，分摊也反过来走。',
  'help.guide.add-expense.tip.3':
    '底部的“附加收据/发票”接受图片和 PDF。它们在你保存时上传，落进行程的“文件”里，列表中名称旁边会出现一个“收据”标记。',
  // expense-payers
  'help.guide.expense-payers.title': '说明这笔账是谁付的',
  'help.guide.expense-payers.goal': '记下谁为一笔支出先垫了钱，这是结算算式的另一半。',
  'help.guide.expense-payers.step.1':
    '用行旁边的铅笔打开一笔支出，看“谁支付的？”。默认是“一人支付”：下拉框里写着掏钱的那一个人。',
  'help.guide.expense-payers.step.2':
    '那个下拉框的第一项“尚无人支付”只记下金额，不让任何人欠下什么。这笔支出仍然计入“行程总支出”。',
  'help.guide.expense-payers.step.3':
    '标签旁边的链接“多人支付”会为每位同行者打开一行。把付过钱的人加入，并填写每人各出了多少；这些金额必须加起来等于总额。',
  'help.guide.expense-payers.step.4':
    '没有人付过的支出会在行上标记“未完成”，并计入“未结算金额”卡片，那里正是已记录但未结清的开销汇集的地方。',
  'help.guide.expense-payers.result': '谁付的钱决定谁被还钱，分摊决定谁该付钱，“余额”就是两者之差。',
  'help.guide.expense-payers.tip.1':
    '“谁支付的？”和“分摊”彼此独立：你可以为一顿自己没去的晚餐付钱，也可以被算进一顿自己没付钱的晚餐。',
  'help.guide.expense-payers.tip.2':
    '有几个付款人时，金额必须加起来等于总额。再加入一个人，其余的人会围着他重新排布；在它们还不相符时，编辑器会说出它们该加到多少，并拒绝保存。',
  'help.guide.expense-payers.tip.3':
    '移除一个付款人并不会移除这笔支出：金额仍留在“行程总支出”里，而这一行会变成“未完成”。',
  // split-expense
  'help.guide.split-expense.title': '在同行者之间分摊一笔账',
  'help.guide.split-expense.goal': '决定谁为一笔支出买单：所有人平摊、按金额，或者照着收据一行一行来。',
  'help.guide.split-expense.step.1':
    '在支出编辑器里，“分摊”列出每一位同行者。点击一个名字就把他排除在这笔支出之外；被排除的同行者显示“不参与”，不必为它承担任何金额。',
  'help.guide.split-expense.step.2':
    '“平均分摊”是默认：每位被包含的同行者分到相同的份额，列表下方的那一行会说明分成几份、每份是多少。',
  'help.guide.split-expense.step.3':
    '“自定义金额”把这些份额换成金额输入框。填入每位同行者该承担的金额；下面那一行会一起计数，达到“分摊金额与总额相符”时变成绿色。不相符时它不会保存。',
  'help.guide.split-expense.step.4':
    '“按账单明细”把收据一行一行拆开：“添加项目”，然后每行填一个名称和一个价格，并在“分摊：”下面列出分担这一行的同行者。',
  'help.guide.split-expense.step.5':
    '明细下方的“每人份额”显示每位同行者最终该承担多少，而顶部的“总金额”由这些明细相加得出。点击“保存”。',
  'help.guide.split-expense.result': '分摊是所有余额的根基。它随支出一起保存，之后可以修改而不牵动别的任何东西。',
  'help.guide.split-expense.tip.1': '你排除掉的同行者显示“不参与”，仅在这一笔支出上不必承担；其余的人接过他的份额。',
  'help.guide.split-expense.tip.2': '“平均分摊”精确到分：多出来的那一分会在支出之间轮转，所以不会总是同一个人来付。',
  'help.guide.split-expense.tip.3': '“按账单明细”模式会自己把“总金额”加出来，并把该字段置灰：收据上的明细就是总额。',
  // expense-currency
  'help.guide.expense-currency.title': '用另一种货币录入支出',
  'help.guide.expense-currency.goal': '照收据上真正写着的录入，让 TREK 替你守住汇率。',
  'help.guide.expense-currency.step.1':
    '打开“添加支出”，按收据上写的原样填写名称和金额，填那个数字本身，而不是换算过的结果。',
  'help.guide.expense-currency.step.2':
    '打开“货币”，挑出收据上的货币。列表里带着 TREK 认识的每一个代码，并且可以搜索：输入那三个字母。',
  'help.guide.expense-currency.step.3':
    '字段下方会出现一行，写明这笔金额此刻值多少，标着“实时汇率”。它只是预览，不是最终存下来的东西。',
  'help.guide.expense-currency.step.4':
    '点击“添加支出”。汇率就在此刻冻结：从此以后，这笔支出就值你录入那天它所值的数。',
  'help.guide.expense-currency.step.5':
    '在账目里，这一行在名称下面带着两个数字：你输入的金额、一个箭头，以及它折成行程货币后的数。上方的每一项合计、余额和结算用的都是第二个。',
  'help.guide.expense-currency.result':
    '这笔支出保留着你输入的金额和货币。账目把两者都显示出来，而行程的各项合计和余额仍保持行程的货币。',
  'help.guide.expense-currency.tip.1':
    '汇率在你保存的那一刻冻结，所以一笔已经结清的欠款不会因为下一周行情变动而重新翻起。只有改掉这笔支出的货币，才会冻结一个新的汇率。',
  'help.guide.expense-currency.tip.2':
    '“设置”里的“显示货币”只改变你读到的内容；存下来的金额从不挪动。留空时，每次行程都按它自己的货币显示。',
  'help.guide.expense-currency.tip.3':
    '行程货币本身在行程上，位于“编辑旅行”下面，需要“编辑旅行详情”的权限。更改它会把每一个冻结的汇率重新锚定，而不是把金额换算成另一种货币。',
  // filter-costs
  'help.guide.filter-costs.title': '找到一笔支出，或者某一天的开销',
  'help.guide.filter-costs.goal': '把一本长长的账目收窄到你真正要找的那一部分。',
  'help.guide.filter-costs.step.1': '在列表上方的“搜索支出…”里输入。它会随着你输入匹配支出的名称。',
  'help.guide.filter-costs.step.2': '“所有类别”会展开十四个分类。挑一个，就只剩下那个分类的支出。',
  'help.guide.filter-costs.step.3':
    '“所有日期”列出每一个花过钱的日子。挑一个，就会有一条横幅取代日期标题，写着那一天、它包含多少笔支出以及它的合计。',
  'help.guide.filter-costs.step.4':
    '“全部”/“我支付的”/“别人欠我”开关是你自己这一边看到的账目：你为哪些掏了钱，又有哪些钱还没回到你手里。',
  'help.guide.filter-costs.step.5': '行末的“导出 CSV”把每一笔支出写进一个文件，带上原始金额、它的货币和换算后的金额。',
  'help.guide.filter-costs.result': '筛选可以叠加，日期分组也会用剩下内容的合计重新绘制。',
  'help.guide.filter-costs.tip.1':
    '已记录的付款没有名称也没有分类，所以搜索或类别筛选会把它们藏起来。日期筛选则把它们留着，归在付款被记下的那一天。',
  'help.guide.filter-costs.tip.2': '“导出 CSV”永远导出每一笔支出，无论屏幕上筛选成什么样，一笔支出一行。',
  // settle-up
  'help.guide.settle-up.title': '算出谁该付给谁，并且结清',
  'help.guide.settle-up.goal': '把一堆共同开销变成让所有人扯平所需的最少几笔转账，并在它们发生时记录下来。',
  'help.guide.settle-up.step.1':
    '右栏的“结算”卡片列出能让所有人扯平的转账：谁付给谁，以及多少。标题旁边的数字是还有几笔未完成。',
  'help.guide.settle-up.step.2': '转账旁边的“结算”把它记为已完成。这条流向从卡片上消失，余额重新绘制。',
  'help.guide.settle-up.step.3': '已记录的转账是账目里的一行，归在它发生的那一天下，标着“付款”，带着两位同行者和金额。',
  'help.guide.settle-up.step.4': '在那一行旁边，铅笔可以更正一笔付款，“撤销”把它收回，转账就回到“结算”卡片上。',
  'help.guide.settle-up.step.5':
    '卡片标题处的“添加付款”用来记录一笔没有按建议进行的转账。挑选“付款方”和“收款方”、金额、它的货币以及它发生的日期。',
  'help.guide.settle-up.step.6':
    '屏幕顶部标题栏里的“结算”把所有未完成的转账一次全部记下，就像一群人在行程结束时一起把账清干净。',
  'help.guide.settle-up.result':
    '每一笔记录下来的转账都是账目里的一行，也是“结算”卡片上少掉的一条。当卡片写着“大家已两清”，这趟行程就付清了。',
  'help.guide.settle-up.tip.1': '卡片显示的是最少的转账，而不是每一笔欠款：三个人绕成一圈互相欠着，会收成一两笔付款。',
  'help.guide.settle-up.tip.2': '“结算”记录的是一笔转账，它并不搬动钱。用你惯用的方式把钱送出去，然后再点它。',
  'help.guide.settle-up.tip.3':
    '一笔付款可以用任何货币进行，所以用欧元还一笔日元的欠款很正常：对话框有自己的货币选择器，也会把那个汇率冻结下来。',
  // final-budget
  'help.guide.final-budget.title': '看看这趟行程让每位同行者花了多少',
  'help.guide.final-budget.goal': '读账目里按人来的那一面：今天的余额，以及每个人的真实花费。',
  'help.guide.final-budget.step.1':
    '“余额”显示每位同行者的位置：如果行程欠他，就是一条向右的绿色条；如果是他欠行程，就是一条向左的红色条，金额写在名字旁边。',
  'help.guide.final-budget.step.2':
    '它下面的“最终花费”回答的是另一个问题：不是此刻谁欠着什么，而是等一切都还清之后，这趟行程让每位同行者花了多少。',
  'help.guide.final-budget.step.3': '点击一个名字，就能展开这笔算式：“已支付的支出”，其下是“还款净额”和“待还款项”。',
  'help.guide.final-budget.step.4':
    '每一行下面坐着构成它的那些条目：那位同行者付过的支出、已经记录的转账以及仍然未完成的转账。它们加起来正好等于上面那一行。',
  'help.guide.final-budget.result':
    '“余额”是今天谁多出谁少出；“最终花费”是等一切都还清之后，这趟行程最终让你们每个人花了多少。',
  'help.guide.final-budget.tip.1': '记录一笔付款不会改变任何人的最终花费。它只是把一笔金额从待还款项挪到还款净额。',
  'help.guide.final-budget.tip.2': '没有付款人的支出不会进入这两张卡片，正如它也不会进入结算建议。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '把一次预订变成一笔支出',
  'help.guide.expense-from-booking.goal': '把一趟航班、一家酒店或一个地点真正花掉的钱，附到它所属的那条记录上。',
  'help.guide.expense-from-booking.step.1': '在“交通”或“预订”标签页打开该预订，点击它的铅笔。',
  'help.guide.expense-from-booking.step.2':
    '滚动到表单底部的“费用”区块。它提供会先保存预订的“创建支出”，以及用于已在“费用”里的支出的“关联已有支出”。',
  'help.guide.expense-from-booking.step.3':
    '点击“创建支出”。预订被保存，表单关闭，费用编辑器随即打开，预订的标题作为名称，它的类型也已经匹配到了一个分类。',
  'help.guide.expense-from-booking.step.4':
    '像填任何一笔支出那样填好金额和它的币种、谁付的钱和分摊，然后保存。此时再打开该预订，就能在“已关联支出”下看到它，旁边有铅笔可以编辑，有“取消关联，保留支出”可以解开关联，有垃圾桶可以移除。',
  'help.guide.expense-from-booking.result':
    '预订带上了它的花费，而这笔支出就是“费用”标签页上一条普通的行，和别的支出一样有付款人、分摊和货币。',
  'help.guide.expense-from-booking.tip.1':
    '删除预订会连同它关联的支出一起删除。预订的“费用”区块里的“移除关联支出”则相反：支出没了，预订还在。“取消关联，保留支出”则两者都保留。',
  'help.guide.expense-from-booking.tip.2': '地点的表单里有同样的区块，其中的“创建支出”会先保存地点。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '交通',
  'help.ctx.trip-transports.summary':
    '把你在各个地点之间送来送去的一切：航班、火车、公交车、汽车、出租车、自行车、邮轮、渡轮，以及 TREK 替你查到的公共交通线路。这个标签页是它们的清单；它们也在计划上创建和查看，并画在地图上。',
  'help.ctx.trip-transports.bullet.1':
    '标签页里只有交通。住宿、餐厅、活动和门票在“预订”里，所以同一条记录永远不会出现两次。',
  'help.ctx.trip-transports.bullet.2':
    '工具栏在“全部”下统计全部数量，并给每个用到的类型一个带自己计数的筛选块：“航班”“火车”“汽车”“公共交通”。右侧的“交通”手动添加一条。',
  'help.ctx.trip-transports.bullet.3':
    '卡片分成三组，每组都能从标题折叠：搜索规划出的线路放在“自动公共交通”，然后是“待确认”，然后是“已确认”。',
  'help.ctx.trip-transports.bullet.4':
    '一张卡片带着状态、类型、它跨越的日子、时间、“预订码”、路线，以及“航空公司”和“航班号”，或者“车次”“站台”“座位”。铅笔打开它，垃圾桶在一次询问之后删除它。',
  'help.ctx.trip-transports.bullet.5':
    '交通也在计划上创建：每个日期标题都有一个“添加交通”的 + 和一个“公共交通”的有轨电车按钮，而两个地点之间的行程时间连接线会为这一段打开同一个搜索。',
  'help.ctx.trip-transports.bullet.6':
    '两端都设好的交通会在地图上画出一条线。日程里它那一行上的路线图标打开这条线，而日期上方工具栏里的“显示所有预订路线”翻转整趟旅行。',
  // transports-list
  'help.guide.transports-list.title': '读懂“交通”标签页',
  'help.guide.transports-list.goal': '在你改动任何东西之前，先知道清单在告诉你什么。',
  'help.guide.transports-list.step.1': '“交通”是旅行的第二个标签页。里面只有交通：酒店、餐厅、活动和门票在“预订”里。',
  'help.guide.transports-list.step.2':
    '工具栏在“全部”下统计每一条交通，并给每个用到的类型一个带自己计数的筛选块。点击一个筛选块只保留那个类型，再点一次就放开。多个筛选块可以同时打开，“全部”把它们清空。',
  'help.guide.transports-list.step.3':
    '“自动公共交通”自成一组，是公共交通搜索规划出的线路。“待确认”和“已确认”装着所有手动录入的内容。标题旁边的箭头把一组折叠起来。',
  'help.guide.transports-list.step.4':
    '一张卡片什么都说了：带“待确认”或“已确认”的状态圆点、类型、它跨越的日子和日期、时间、“预订码”、路线，以及“航空公司”和“航班号”，或者“车次”“站台”“座位”。',
  'help.guide.transports-list.step.5': '铅笔打开交通进行编辑，垃圾桶在一次点名要删什么的询问之后把它删掉。',
  'help.guide.transports-list.result': '清单收窄到你要找的东西，每张卡片一眼就说明这趟行程订没订上。',
  'help.guide.transports-list.tip.1':
    '筛选块和折叠起来的分组按每趟旅行分别记住，所以标签页会照你离开时的样子重新打开。',
  'help.guide.transports-list.tip.2':
    '只有当服务器能读取预订确认件、并且连接了一个 AirTrail 实例时，“从文件导入”和 AirTrail 才会和“交通”一起出现在工具栏里。没有它们，清单就靠手动录入和公共交通搜索来填。',
  // add-transport
  'help.guide.add-transport.title': '把一段交通加到某一天',
  'help.guide.add-transport.goal': '把从一个地点带你到下一个地点的行程，放进它发生的那一天。',
  'help.guide.add-transport.step.1':
    '每个日期标题右侧有四个小按钮。点击那个提示写着“添加交通”的 +。表单打开时，“日期”已经设成了那一天。',
  'help.guide.add-transport.step.2':
    '“预订类型”选你要坐什么：“航班”“火车”“公交车”“汽车”“出租车”“自行车”“邮轮”“渡轮”或“其他”。表单随之变化。航班在每一段上要一个机场，火车要一串车站，汽车用的是“取车”和“还车”的说法以及“沿途停靠点”。',
  'help.guide.add-transport.step.3':
    '“标题”是唯一必须填的字段；没有它，“添加”一直是灰的。写上你在站台信息牌上能认出来的东西。',
  'help.guide.add-transport.step.4':
    '“出发”和“到达”搜索车站、港口或地址。至少输入三个字母，再从列表里选一个结果。只是打上去的名字不带坐标，因此在地图上什么也画不出来。',
  'help.guide.add-transport.step.5':
    '“日期”和“开始时间”说明它什么时候走，“结束日期”和“结束时间”说明它什么时候结束；第二天才到的行程在那一头取第二天。“预订码”、带“待确认”或“已确认”的“状态”以及“备注”都是可选的。',
  'help.guide.add-transport.step.6': '点击“添加”。',
  'help.guide.add-transport.result':
    '这段交通成为那一天的一行，按它的时间排在各地点之间，同时在“交通”标签页里成为“待确认”或“已确认”下的一张卡片。',
  'help.guide.add-transport.tip.1':
    '这一行落在它的开始时间决定的位置，也就是最后一个开始得更早的地点之后。它的拖动柄能把它拖到当天任何别的位置，或者拖到另一天。',
  'help.guide.add-transport.tip.2':
    '“文件”下的“附加文件”接住车票，“费用”下的“创建支出”保存这条预订，并为票价打开“费用”编辑器。',
  'help.guide.add-transport.tip.3':
    '“出行人”标出谁在这趟行程上。只要有一条交通带了出行人，标签页的工具栏就长出他们的头像，并按他们筛选清单。',
  // plan-transit
  'help.guide.plan-transit.title': '规划一条公共交通线路',
  'help.guide.plan-transit.goal': '让 TREK 查出某一天两点之间真实的火车和公交，把你选中的那一条放进计划。',
  'help.guide.plan-transit.step.1': '在日期标题里点击有轨电车按钮，“公共交通”。搜索为那一天打开。',
  'help.guide.plan-transit.step.2':
    '“出发地”和“目的地”接受一个站点或车站。框还空着时，会先给出当天自己的地点和这趟旅行的住处；输入两个字母则改为搜索时刻表里的车站。两个框之间的“交换”把线路掉头。',
  'help.guide.plan-transit.step.3':
    '“出发”或“到达”加上一个时间说明你想什么时候走，“最佳路线”“减少换乘”或“减少步行”说明结果该怎么排序。',
  'help.guide.plan-transit.step.4':
    '下面的筛选块说明可以用哪些方式：“火车”“地铁”“有轨电车”“公交车”“渡轮”和“缆车”。关掉一个就把它排除在外，至少要留一个开着。然后点击“搜索”。',
  'help.guide.plan-transit.step.5':
    '每个结果给出发车和到达时间、要多久、换乘几次、步行多少，以及各条线路各自的颜色。点击其中一个可以一站一站展开，连站台和线路之间的步行都在。',
  'help.guide.plan-transit.step.6': '点击“添加到当天”。',
  'help.guide.plan-transit.result':
    '这条线路成为那一天的一行，带着它的线路、换乘和步行时间，同时在“交通”标签页里成为“自动公共交通”下的一张卡片。',
  'help.guide.plan-transit.tip.1':
    '线路来自 Transitous，一个建立在公开时刻表数据之上的免费社区服务：不用密钥，不用账号。管理员可以把搜索改指向 Google。',
  'help.guide.plan-transit.tip.2':
    '什么也没找到？数据源只覆盖一个区域和一段时期。换个时间试试，多打开几种方式，或者选一个车站而不是地点本身。提示信息会写出回应的那个服务的名字。',
  'help.guide.plan-transit.tip.3':
    '同一个搜索也能为单独一段打开：点击两个地点之间的行程时间连接线，选“公共交通”。“出发地”“目的地”和出发时间都已经替你填好。',
  // change-transit-route
  'help.guide.change-transit-route.title': '打开并更改一条规划好的线路',
  'help.guide.change-transit-route.goal': '一站一站地读这条线路，给它改名，或者重新查一次路线。',
  'help.guide.change-transit-route.step.1': '在“交通”标签页里，规划好的线路在“自动公共交通”下面。点击卡片。',
  'help.guide.change-transit-route.step.2':
    '“时长”“换乘”和“步行”在最上面。它们下面的“行程”一站一站地走完这条线路，连站台和线路之间的步行都在。',
  'help.guide.change-transit-route.step.3': '“更改路线”重新跑一次搜索，这条线路的两端和它的日期都已经填好。',
  'help.guide.change-transit-route.step.4':
    '选另一条线路并点击“添加到当天”，它就顶替旧的那条。而“更改路线”旁边的“编辑详情”打开的是普通的交通表单，“预订码”、“状态”、出行人和文件都在那里。',
  'help.guide.change-transit-route.result': '这段行程带上了新的行程安排，它在“交通”标签页里的卡片显示新的线路和时间。',
  'help.guide.change-transit-route.tip.1':
    '行程的标题只是文字：旁边的铅笔给它改名，不会动到路线。下面的“备注”接受 markdown，并有“编辑”和“预览”两个标签。',
  'help.guide.change-transit-route.tip.2': '行程底部的“删除”把这条线路从这趟旅行里拿走；那一天仍然保留它的地点。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '更改某一段的出行方式',
  'help.guide.leg-travel-mode.goal': '在其余路段都开车的一天里，把其中一段改成步行，或者把那一段交给公共交通搜索。',
  'help.guide.leg-travel-mode.step.1':
    '地点之间的连接线只有在当天的路线打开之后才出现。点击这一天把它展开，然后点它地点下方的“路线”。',
  'help.guide.leg-travel-mode.step.2':
    '每条连接线说明那一段的行程时间和距离，并带上算路时所用方式的图标：开车是汽车，步行是脚。',
  'help.guide.leg-travel-mode.step.3': '点击连接线。菜单提供“驾车”和“步行”、“公共交通”，以及“使用当日默认”。',
  'help.guide.leg-travel-mode.step.4': '选“步行”。只有这一段会变；当天其余部分保留自己的方式。',
  'help.guide.leg-travel-mode.result': '这一段显示脚的图标和它的步行时间，当天其他各段保留当天的方式。',
  'help.guide.leg-travel-mode.tip.1':
    '方式属于路段，不属于当天：整天的“驾车”和“步行”按钮从不覆盖你手动设过的路段。“使用当日默认”把这一段还给它们。',
  'help.guide.leg-travel-mode.tip.2': '同一个菜单里的“公共交通”正好为这一段打开线路搜索，两端和出发时间都已经填好。',
  'help.guide.leg-travel-mode.tip.3':
    '时间来自一个跑在真实道路和步道上的公共路径服务。它算不出来的路段保留直线，并且不显示时间。',
  // edit-transport
  'help.guide.edit-transport.title': '更改或删除一段交通',
  'help.guide.edit-transport.goal': '改一个时间、一个站台或一个预订码，或者把这趟交通从旅行里去掉。',
  'help.guide.edit-transport.step.1': '在日程里，一段交通是地点之间一条带颜色的行。点击它。',
  'help.guide.edit-transport.step.2':
    '表单就是创建它的那一个，标题栏写着“编辑交通”。什么都能改：类型、路线、日期和时间、“预订码”、“状态”。',
  'help.guide.edit-transport.step.3':
    '航班的路线是一串机场，火车的路线是一串车站。“添加经停”在中间再放一个，每一段都保留自己的时间和自己的航班号或车次。',
  'help.guide.edit-transport.step.4':
    '点击“更新”。要把这段交通彻底移除，用它在“交通”标签页那张卡片上的垃圾桶，并确认。',
  'help.guide.edit-transport.result':
    '改动在这段交通出现的每个地方都会显示：“交通”标签页、它所在的那一天，以及它在地图上的线。',
  'help.guide.edit-transport.tip.1':
    '同一个表单从两边都能打开：“交通”标签页卡片上的铅笔，和日程里这段交通自己的行。规划好的公共交通线路是例外：它的行打开的是行程视图，那里的“编辑详情”才通向这个表单。',
  'help.guide.edit-transport.tip.2': '把一段交通挪到另一天根本不需要表单：把它的行从一张日期卡片拖到下一张。',
  // transport-on-map
  'help.guide.transport-on-map.title': '把一段交通画到地图上',
  'help.guide.transport-on-map.goal': '看看一次航班、一段驾车或一条线路实际走的是哪里。',
  'help.guide.transport-on-map.step.1':
    '两端都设好的交通，会在日程里它那一行上带一个小小的路线图标。点击它，它的标签就变成“隐藏预订路线”。',
  'help.guide.transport-on-map.step.2': '路线画在地图上，两端各有一个带着这段交通图标的胶囊形标记。',
  'help.guide.transport-on-map.step.3':
    '点击端点标记，不用离开地图就能读到这条预订：时间、“航空公司”和“航班号”、“预订码”以及地址。“关闭”把这张卡片收起来。',
  'help.guide.transport-on-map.step.4':
    '日期上方工具栏里的路线图标一次处理整趟旅行：“显示所有预订路线”，以及用来再次清空的“隐藏所有预订路线”。',
  'help.guide.transport-on-map.step.5':
    '规划好的公共交通线路没有自己的图标。它是靠当天的“路线”开关画出来的，所以只要那一天的路线还开着，“隐藏所有预订路线”就清不掉它。',
  'help.guide.transport-on-map.result': '各条路线带着两端的标记留在地图上，直到你再次把它们关掉。',
  'help.guide.transport-on-map.tip.1':
    '航班、邮轮和渡轮画成一条曲线，汽车、公交车、出租车和自行车沿着真实道路走，火车或规划好的线路则穿过它停靠的各个车站。',
  'help.guide.transport-on-map.tip.2':
    '“已确认”的预订是实线，“待确认”的是虚线。“预订路线标签”这个设置会把机场代码或车站名称印进端点标记里。',
  'help.guide.transport-on-map.tip.3':
    '“显示所有预订路线”是重新来过，而不是叠一层：它会丢掉单个图标设过的状态，所以按两次之后，留给你的要么是全开，要么是全关。',
  // import-transport-file
  'help.guide.import-transport-file.title': '从电子票里读出一趟航班',
  'help.guide.import-transport-file.goal':
    '让 TREK 从承运方发来的票里取出一趟航班、一趟火车或一班渡轮，并在保存前检查一遍。',
  'help.guide.import-transport-file.step.1':
    '点击“交通”标签页工具栏里的“从文件导入”，就在“交通”按钮旁边。“导入预订确认”打开，和“预订”标签页用的是同一个对话框。',
  'help.guide.import-transport-file.step.2':
    '把票拖放到那个框上，或点击它来挑选：EML、PDF、PKPass、HTML 和 TXT，最多 5 个文件，每个 10 MB。你挑的那些文件的名字会写在框上。',
  'help.guide.import-transport-file.step.3': '点击“导入”。对话框立刻关上；读取在后台进行。',
  'help.guide.import-transport-file.step.4':
    '右下角的一张卡片在文件名下报告这次运行。读取完成后，“正在解析文件…”变成一个对勾，卡片给出“导入”。点击它。',
  'help.guide.import-transport-file.step.5':
    '一趟航班在“添加交通”里打开，内容已填好：“预订类型”是“航班”，航空公司和航班号在“标题”里，两个机场在“航线”下，带“出发”和“到达”、它们的时间和时区，“航空公司”和“航班号”，“预订码”，以及“文件”下的票。检查一遍，点击“添加”。',
  'help.guide.import-transport-file.result':
    '这趟航班是“交通”标签页里“待确认”中的一张卡片，也是它出发那天的一行，票在“文件”下；两个机场都已知时，它会在地图上画出自己的弧线。',
  'help.guide.import-transport-file.tip.1':
    '两个标签页共用一个导入：一份既有航班又有酒店的文件，会先后把航班在“添加交通”里、把酒店在“新建预订”里打开，不论你从哪个标签页开始。',
  'help.guide.import-transport-file.tip.2':
    '机场按代码定位。读取时定位不到的车站或港口会在卡片上以琥珀色标出名字；在点击“添加”之前先在“航线”下手动选好它，否则这条交通在地图上什么都画不出来。',
  // airtrail-import
  'help.guide.airtrail-import.title': '从 AirTrail 导入航班',
  'help.guide.airtrail-import.goal': '把你已经记在 AirTrail 里的航班一次带进旅行，并让它们从此跟随 AirTrail。',
  'help.guide.airtrail-import.step.1':
    '开着 AirTrail 扩展，并在“设置”的“集成”下连接了你的实例之后，“交通”标签页的工具栏里“交通”旁边会有一个“AirTrail”按钮。点击它。',
  'help.guide.airtrail-import.step.2':
    '“从 AirTrail 导入”把你账户里的航班分两组列出。“行程期间”是日期落在旅行内的那些，已经勾选；“其他航班”是其余的，未勾选。已经在旅行里的航班灰显并标着“已导入”。',
  'help.guide.airtrail-import.step.3':
    '每一行是一个勾选框，带航空公司和航班号、两个机场和日期。点击一行把航班收进来或排除出去；“其他航班”下的只有在你勾选时才会进来。',
  'help.guide.airtrail-import.step.4':
    '相连的航班，即每一趟都在一天之内从上一趟降落的机场起飞，会被框在一起。下方的勾选框“导入为一个航班（在该机场中转）”已经勾上：留着它就得到一条带经停的预订，取消它则把各航段作为单独的航班导入。',
  'help.guide.airtrail-import.step.5': '点击“导入”。按钮会统计勾选的航班数，之后的提示会说进来了多少趟。',
  'help.guide.airtrail-import.step.6':
    '这些航班是“已确认”下的卡片，每张状态旁边都带一个蓝色的 AirTrail 徽章，也是它们运行那些天上的行。合并的联程是一张卡片，航线穿过中转地。',
  'help.guide.airtrail-import.result':
    '来自 AirTrail 的航班是“交通”标签页里的卡片和各自日期上的行，每一条都带着说明来源的 AirTrail 徽章。',
  'help.guide.airtrail-import.tip.1':
    '同一航班号、同一日期已经在旅行里的航班会被跳过，提示会说跳过了多少趟。天数上方工具栏里的“撤销”把整次导入收回。',
  'help.guide.airtrail-import.tip.2':
    'AirTrail 仍是事实来源。TREK 在你打开旅行时以及后台每隔几分钟读取它的更改；在那边删掉的航班保留它的卡片，徽章变为“未同步”。在 TREK 里做的修改只有在“集成”下开着“将更改写回 AirTrail”时才会传回去。',
  'help.guide.airtrail-import.tip.3':
    '合并的联程没有单独一趟 AirTrail 航班可跟随，所以它是一次性导入：它保留蓝色徽章，悬停徽章会这样说明。你手动加了经停的已同步航班也是如此。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '公路旅行',
  'help.ctx.trip-roadtrip.summary':
    '把计划当作一次驾驶来读：同样的日期、同样的地点，串成一个个停靠点，中间是行驶的路段，落在左栏的行程条里和地图上。它会说明有多远、要多久、油在哪里耗尽，以及路上有什么。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左栏顶部的“按天”和“公路旅行”在每日计划和驾驶之间切换。什么都不会被复制，什么都不会被改动：“按天”原封不动地把计划还给你。',
  'help.ctx.trip-roadtrip.bullet.2':
    '行程条的顶部汇总整趟旅行：“距离”“驾驶时间”和“停靠点”。它下面每天一张卡片，带着当天自己的公里数、这一天是为几个停靠点而设、超出了什么，以及一个“轨迹”标记。',
  'help.ctx.trip-roadtrip.bullet.3':
    '带编号的停靠点是这一天要去的地点。途中停靠，比如加油、充电、服务区，戴的是它那一类的图标而不是编号，也不计入数量。点击编号可以改变它是哪一种，点击“停留”标记可以说明它要花多久。',
  'help.ctx.trip-roadtrip.bullet.4':
    '两个停靠点之间，驾驶条把这一段显示为距离和时间。点击它打开“这一段的走法”，或者点击地图上画出的路线，用一个途经点把这一段拗过去。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右栏变成“沿线”：选一天、选要找什么、选走廊有多宽，然后点“搜索”。“添加”会把结果放到驾驶上真正经过它的那一点。',
  'help.ctx.trip-roadtrip.bullet.6':
    '它下面的“驾驶设置”装着各项上限、车和它的续航、每日出行时间、要避开什么以及线条怎么画。它们属于这趟旅行，所以每个人都用同一辆车来计划。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '把旅行当成一次驾驶来读',
  'help.guide.roadtrip-mode.goal': '把计划切换到公路旅行模式，读懂行程条告诉你的内容。',
  'help.guide.roadtrip-mode.step.1':
    '在左栏顶部的“按天”和“公路旅行”切换里点击“公路旅行”。每日计划被驾驶取代，地图会画出每一个已经算出路线的日子。',
  'help.guide.roadtrip-mode.step.2': '行程条的顶部汇总整趟旅行：“距离”“驾驶时间”和“停靠点”。',
  'help.guide.roadtrip-mode.step.3':
    '它下面每天一张卡片。卡片标题带着这一天的编号和日期、以距离和时间表示的驾驶，以及这一天是为几个停靠点而设。',
  'help.guide.roadtrip-mode.step.4':
    '卡片里面，一天是一条链：每个地点一个带编号的停靠点，每两个之间一个驾驶条，右端是到达时间。',
  'help.guide.roadtrip-mode.step.5':
    '点击某一天的标题把它折叠起来。折叠的一天也会从地图上消失；再次点击标题就能让它回来。',
  'help.guide.roadtrip-mode.result': '左栏就是驾驶，地图显示它的每一天。“按天”直接切回计划，计划没有变化。',
  'help.guide.roadtrip-mode.tip.1': '只要浏览器标签页还开着，这个选择就按旅行记住，所以重新载入还会回到驾驶。',
  'help.guide.roadtrip-mode.tip.2': '只有管理员在“管理后台”的“扩展”里开启了“公路旅行”扩展之后，这个切换才存在。',
  'help.guide.roadtrip-mode.tip.3': '手机上没有切换：扩展会在“计划”旁边加一个自己的“公路旅行”标签页。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中的停靠，以及停留多久',
  'help.guide.roadtrip-stops.goal': '把驾驶途中的一个地点变成途中停靠，并说明每个停靠要花多久。',
  'help.guide.roadtrip-stops.step.1':
    '点击行程条里某个停靠点前面的编号。它的标签是“设为途中停靠”，点开后是“停靠类型”。',
  'help.guide.roadtrip-stops.step.2':
    '选一个类型：“住宿”“加油”“充电”“服务区”“露营地”“餐饮”或“景点”。编号变成那一类的图标，它下面的停靠点重新编号。',
  'help.guide.roadtrip-stops.step.3': '途中停靠不是目的地，所以这一天的标题少算一个停靠点。',
  'help.guide.roadtrip-stops.step.4': '再次点击图标，进入“更改停靠类型”，选择“恢复为目的地”，编号就回来了。',
  'help.guide.roadtrip-stops.step.5': '每个停靠点都带着“停留”标记。点击它打开“在此停留时间”。',
  'help.guide.roadtrip-stops.step.6':
    '用滑块、用减号和加号按钮，或者用其中一个预设值来设定时长，看看“到达”和“出发”怎么变，然后点“保存”。',
  'help.guide.roadtrip-stops.result':
    '你定了时间的那个停靠点在它的“停留”标记上带着钟点，它之后的每一个到达时间都跟着移动了；那个被你送去某一类又送回来的停靠点，重新成了带编号的目的地。',
  'help.guide.roadtrip-stops.tip.1': '停留属于地点，而不属于某一次到访：安排在两天里的同一个地点，两天都停留同样久。',
  'help.guide.roadtrip-stops.tip.2':
    '途中停靠在“按天”下面也会显示。把“驾驶设置”中“服务停靠点”里的“也显示于每日行程”关掉，它们就只留在“公路旅行”里。',
  'help.guide.roadtrip-stops.tip.3': '同一个对话框里的“不停留”会再次去掉这段时间。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '沿线找加油站、餐饮和住处',
  'help.guide.roadtrip-corridor.goal': '在你真正开过的路上搜索，把找到的放在正确的路段上。',
  'help.guide.roadtrip-corridor.step.1': '在“沿线”顶部选一天。只提供已经算出路线的日子。',
  'help.guide.roadtrip-corridor.step.2':
    '在“查找”下面勾选你需要的。“加油”“充电”“服务区”“露营地”“住宿”“餐饮”和“景点”可以组合。',
  'help.guide.roadtrip-corridor.step.3': '在“范围内”里选择在道路两侧找多远，2 km、5 km 或 10 km，然后点“搜索”。',
  'help.guide.roadtrip-corridor.step.4':
    '结果按类型分组返回，顺序就是你经过它们的顺序，每一条都带着它在这一天的哪个位置，以及离路线有多远。',
  'help.guide.roadtrip-corridor.step.5':
    '结果上的“添加”会打开“添加为停靠点”。它会说明这个停靠点落在哪一天、第几个位置，询问类型和停靠时间，“添加”把它放到驾驶上。',
  'help.guide.roadtrip-corridor.result':
    '结果按你经过的顺序列出并画在地图上，你添加的那一个就坐落在驾驶上真正经过它的那一点。',
  'help.guide.roadtrip-corridor.tip.1': '在你按下“搜索”之前什么都不会被搜索：跑一次就是对一个共享服务发出的许多请求。',
  'help.guide.roadtrip-corridor.tip.2':
    '“按名称筛选”不再发起请求就把返回的结果缩小，“清除结果”清空列表和它的标记点。点击一条结果可以让它在地图上显示出来。',
  'help.guide.roadtrip-corridor.tip.3':
    '结果也可以从地图拖到画出的路线上，同一条路被开过两次时，你就是这样自己挑路段的。“搜索”旁边的“手动添加”则按名称查找一个地点。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '用途经点把一段路拗弯',
  'help.guide.roadtrip-via.goal': '让一段路走你真正想要的那条道，而不用给它加一个停靠点。',
  'help.guide.roadtrip-via.step.1':
    '先让你想要的那一段进入视野：在行程条里点击一个停靠点，然后关掉在地图上打开的卡片。',
  'help.guide.roadtrip-via.step.2': '点击画出的路线。一个途经点落在你点击的那一段上，这一段会经由它重新算一次路线。',
  'help.guide.roadtrip-via.step.3':
    '行程条随之改变：这一天的标题带上新的距离和驾驶时间，途经点之后的每一个到达时间都跟着移动。',
  'help.guide.roadtrip-via.step.4':
    '把鼠标停在手柄上，它会说明自己能做什么：“拖动可改变路线，右键删除”。把它拖到别处，这一段就经由新位置重新画出。',
  'help.guide.roadtrip-via.step.5': '右键点击手柄可以把它去掉。这一段又走最直接的路。',
  'help.guide.roadtrip-via.result': '这一段走你选的路，这一天的距离、驾驶时间和到达时间都会为它重新算过。',
  'help.guide.roadtrip-via.tip.1': '途经点不是停靠点：它没有编号、没有停留、没有到达时间，也不计入这一天的停靠点。',
  'help.guide.roadtrip-via.tip.2': '手柄从缩放级别 9 开始才画出来，所以一张适配整趟旅行的地图只会显示线条而没有手柄。',
  'help.guide.roadtrip-via.tip.3': '距离任何已画路段超过两公里的点击会被忽略，点在航班、火车或渡轮上的点击也一样。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '换一条路来开这一段',
  'help.guide.roadtrip-alternatives.goal': '看看路线引擎对某一段还给出什么，然后采用它。',
  'help.guide.roadtrip-alternatives.step.1':
    '点击行程条里的一条驾驶条，就是两个停靠点之间那一行、把这一段显示为距离和时间的那一行。它的标签是“其他路线”。',
  'help.guide.roadtrip-alternatives.step.2':
    '“这一段的走法”在地图上方打开，每条路一项，每一项都以自己的颜色画在地图上。',
  'help.guide.roadtrip-alternatives.step.3':
    '把鼠标停在某一项上会点亮那条路。“当前”是正在走的那条路，“最快”是最快的那条；其他项则说明自己慢多少，或者避开了哪一类道路。',
  'help.guide.roadtrip-alternatives.step.4': '点击一项就走那条路，点“关闭”就保持你正在走的路。',
  'help.guide.roadtrip-alternatives.result': '这一段走你选的路，行程条上的距离和它之后的到达时间也随之改变。',
  'help.guide.roadtrip-alternatives.tip.1':
    '选另一条路会在这一段上放一个途经点，并替换掉它原有的途经点；选择路线引擎自己的那条路又会把它们去掉。',
  'help.guide.roadtrip-alternatives.tip.2':
    '“不走高速”“免收费”和“不乘轮渡”来自第二个引擎，它有自己的速度模型，所以它们的用时不能和其他项相比。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '设定车辆和驾驶上限',
  'help.guide.roadtrip-limits.goal': '告诉 TREK 你开什么车，以及你愿意一口气开多久。',
  'help.guide.roadtrip-limits.step.1': '“驾驶设置”位于右栏搜索的下方。它的标记说明已经设了什么；点击它即可打开。',
  'help.guide.roadtrip-limits.step.2':
    '在“驾驶”下面，“单次最长驾驶”和“每天驾驶”以分钟计。空着的字段意味着“关闭”，也就不会标出任何东西。',
  'help.guide.roadtrip-limits.step.3':
    '在“车辆”下面，说明你开什么车。“燃油”只在加油停靠点补给，“电动”只在充电停靠点补给，“两者”在两种停靠点都补给。',
  'help.guide.roadtrip-limits.step.4':
    '“单箱续航”或“每次充电续航”由你自己填。它下面的“根据车辆数据推算”会取“油箱容量”和“能耗”，或者“电池容量”和“能耗”，替你算出来。',
  'help.guide.roadtrip-limits.step.5':
    '“尽量避开”是一种偏好，不是禁令：没有绕行办法的一天照样会走那条路，并在标题里说明这一点。',
  'help.guide.roadtrip-limits.step.6': '关闭对话框。卡片会说明已经设了什么，行程条会标出每一个超出上限的路段和日子。',
  'help.guide.roadtrip-limits.result':
    '卡片上的标记说明已经设了什么，每一个超出上限的路段和日子都在行程条里带着一个标记。',
  'help.guide.roadtrip-limits.tip.1': '这些设置属于这趟旅行，所以同行的每个人都用同一辆车、同样的上限来计划。',
  'help.guide.roadtrip-limits.tip.2':
    '“加到”说明一个停靠点加到多满，因为路上没有人会充到 100 %。加油或充电停靠点可以为自己单独覆盖它。',
  'help.guide.roadtrip-limits.tip.3':
    '“路线线条”决定驾驶怎么画：“连接各天”会把两天之间的那一夜也算出路线，“每天一种颜色”则给每一天自己的颜色。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '给驾驶的一天定个开始和结束',
  'help.guide.roadtrip-day-window.goal': '在你选定的时刻停止驾驶，并说明这一天应该在哪里结束。',
  'help.guide.roadtrip-day-window.step.1': '打开右栏的“驾驶设置”，找到“每日出行时间”。',
  'help.guide.roadtrip-day-window.step.2':
    '设一个“一天开始时间”。光有它什么都不会发生：正如它们下面的说明所讲，两个时间都要有。',
  'help.guide.roadtrip-day-window.step.3':
    '设一个“一天结束时间”。驾驶现在会在那个时刻停下，把剩下的带到第二天早上，在行程条里表现为一行“当天行程结束”和一行“继续行程”。',
  'help.guide.roadtrip-day-window.step.4':
    '在“一天的结束地点”里，选“路线途中”表示在结束时间停在路上，或者选“最后一个地点”表示在下一段驾驶会越过它之前就停下。',
  'help.guide.roadtrip-day-window.step.5': '关闭对话框。“驾驶设置”卡片把这两个时间当作标记带着。',
  'help.guide.roadtrip-day-window.result':
    '驾驶被切成你设定长度的出行日，装不下的部分会接在最后一天之后的推算日上继续。你的日期和它们的地点不会改变。',
  'help.guide.roadtrip-day-window.tip.1': '清空任何一个时间又会把整件事关掉。你自己钉在某个停靠点上的时间始终优先。',
  'help.guide.roadtrip-day-window.tip.2':
    '设了每日出行时间之后，各天总是相连的：从某一天最后一个停靠点到第二天第一个停靠点的驾驶也会算出路线并计入。',
  'help.guide.roadtrip-day-window.tip.3':
    '每一个当天终点在地图上也是一个标记，一个带着日期编号的月亮。沿路线拖动它，或者把它拖到某个地点上，就能让这一天在别处结束；右键点击它可以恢复自动的终点，而这个对话框里的“恢复自动每日终点”会把全部撤销。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '在油耗尽之前加满',
  'help.guide.roadtrip-refuel.goal': '在车还能到达的那一段上找个加油的地方，并把它放到驾驶上。',
  'help.guide.roadtrip-refuel.step.1':
    '设了续航之后，行程条会在油耗尽的那一段上画一条带子：“此处将耗尽油量”，下面是它在这一段里走了多远。',
  'help.guide.roadtrip-refuel.step.2':
    '带子上的那盏灯就是按钮。“查找加油站”会沿着你已经开过的路去找，找的时候显示“正在沿路线查找…”。',
  'help.guide.roadtrip-refuel.step.3': '最多返回三个加油站，每一个都带着它离路线有多远，以及还会剩下多少续航。',
  'help.guide.roadtrip-refuel.step.4':
    '某个候选上的加号会把它添加为加油停靠点。“添加为停靠点”打开时类型和时间已经填好，“添加”把它放到这一段上真正经过它的那一点。',
  'help.guide.roadtrip-refuel.result': '这个停靠点带着自己的图标落在正确的路段上，续航从它开始重新计算，带子也不见了。',
  'help.guide.roadtrip-refuel.tip.1':
    '续航从上一个加油或充电停靠点开始计算，跨越日期。你开什么车决定哪些停靠点算数：“燃油”只算加油，“电动”只算充电。',
  'help.guide.roadtrip-refuel.tip.2':
    '搜索只看耗尽点之前的路，留出一份余量，并且把绕行距离算两遍，所以它给出的每一个都真的到得了。',
  'help.guide.roadtrip-refuel.tip.3': '空的结果不是死路：那盏灯会变成“重试”，因为地点搜索是一个共享服务，确实会超时。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '让某一天沿着导入的轨迹走',
  'help.guide.roadtrip-track.goal': '把某一天的驾驶放到你以 GPX 或 KML 轨迹导入的风景路线上。',
  'help.guide.roadtrip-track.step.1': '点击某一天标题里的“轨迹”标记。对话框就在那一天上打开。',
  'help.guide.roadtrip-track.step.2':
    '选一条轨迹。每一条都会说明它有多长，以及它是沿着这一天走的，还是离这一天有多远，最近的排在最前面。',
  'help.guide.roadtrip-track.step.3':
    '点击“沿此轨迹行驶”。TREK 会在驾驶偏离轨迹最远的地方放下途经点，然后一轮又一轮地重新算路线。',
  'help.guide.roadtrip-track.step.4':
    '它会说明放了多少个途经点，以及驾驶现在贴得有多近。它下面的按钮会再把那些途经点去掉，把这一天交回给路线引擎；关闭对话框则保留轨迹。',
  'help.guide.roadtrip-track.result':
    '这一天的驾驶沿着轨迹走，而不是路线引擎挑的那条路，它的“轨迹”标记亮着，把指针停上去就会说出那条轨迹的名字。',
  'help.guide.roadtrip-track.tip.1':
    '在“按天”下面用“导入文件”导入这个文件，并勾上“路线”或“轨迹（含路径几何）”。在旅行里有一条之前，没有哪一天会带着这个标记。',
  'help.guide.roadtrip-track.tip.2':
    '沿着轨迹走会替换这一天各路段原有的途经点，所以要手动调整某一段，请在轨迹之后做，而不是之前。',
};

export default help;
