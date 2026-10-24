import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': '检查我的路线是否有变化',
  'wanderer.watch.hint': '导入的路线可能已变化时通知你。',
  'wanderer.watch.info':
    'TREK 每天最多读取一次你导入的每条路线的简短记录，从不读取其 GPX 文件。它只会通知你：是否采纳变化，由你通过行程的来源检查自行决定。',
  'wanderer.watch.notConnected': '请先连接 wanderer',
  'wanderer.watch.on': '后台检查已开启',
  'wanderer.watch.off': '后台检查已关闭',
  'wanderer.watch.failed': '无法切换后台检查',
  'wanderer.watch.lastRun': '上次检查 {date}',
  'wanderer.watch.neverRun': '尚未检查',
  'wanderer.watch.paused': '暂停至 {time}',
  'wanderer.watch.pausedHint': 'wanderer 没有响应。每次失败后，TREK 会等待更久再询问。',
  'wanderer.watch.blocked': '令牌被拒绝',
  'wanderer.watch.blockedHint': 'wanderer 拒绝了 API 令牌。连接测试通过或保存新令牌后，检查会继续。',
  'wanderer.watch.hints': '提示',
  'wanderer.watch.hintsCount': '{count} 条未处理提示',
  'wanderer.watch.empty': '没有未处理的提示',
  'wanderer.watch.dialogTitle': '关于你的路线的提示',
  'wanderer.watch.openTour': '打开行程',
  'wanderer.watch.checkedAt': '检查于 {date}',
  'wanderer.watch.noticeLabel': '后台检查',
  'wanderer.watch.state.possible_change': '可能已变化',
  'wanderer.watch.state.changed': '已变化',
  'wanderer.watch.state.unverifiable': '无法检查',
  'wanderer.watch.stateHint.possible_change': 'wanderer 更改了路线的时间戳。内容是否不同，只有来源检查才能看出。',
  'wanderer.watch.stateHint.changed': 'wanderer 的记录显示了不同的名称或描述。来源检查会显示所有变化。',
  'wanderer.watch.stateHint.unverifiable': 'TREK 无法判断这条路线，因此对是否变化不作任何说明。',
  'wanderer.watch.reason.unavailable': '无法访问路线',
  'wanderer.watch.reason.no_change_time': '没有时间戳',
};
export default wandererWatch;
