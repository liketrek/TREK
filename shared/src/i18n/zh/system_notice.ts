import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': '欢迎使用 TREK',
  'system_notice.welcome_v1.body': '您的全能旅行规划器。制定行程、与朋友分享旅行，随时保持井然有序——在线或离线均可。',
  'system_notice.welcome_v1.cta_label': '规划行程',
  'system_notice.welcome_v1.hero_alt': '风景优美的旅游目的地与 TREK 界面',
  'system_notice.welcome_v1.highlight_plan': '逐日行程规划',
  'system_notice.welcome_v1.highlight_share': '与旅行伙伴协作',
  'system_notice.welcome_v1.highlight_offline': '移动端支持离线使用',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.pager.prev': '上一条通知',
  'system_notice.pager.next': '下一条通知',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '转到通知 {n}',
  'system_notice.pager.position': '通知 {current}/{total}',
  'system_notice.v3_photos.title': '3.0 版照片已迁移',
  'system_notice.v3_photos.body':
    '行程规划器中的​**照片**标签已被移除。您的照片安全无虑 — TREK 从未修改您的 Immich 或 Synology 相册。\n\n照片现在位于 **Journey** 插件中。Journey 是可选的 — 如果尚未启用，请联系管理员在 Admin → 插件 中开启。',
  'system_notice.v3_journey.title': '认识 Journey — 旅行日记',
  'system_notice.v3_journey.body': '将您的旅程记录为展示时间线、照片画廊和互动地图的丰富旅行故事。',
  'system_notice.v3_journey.cta_label': '打开 Journey',
  'system_notice.v3_journey.highlight_timeline': '每日时间线与画廊',
  'system_notice.v3_journey.highlight_photos': '从 Immich 或 Synology 导入',
  'system_notice.v3_journey.highlight_share': '公开分享 — 无需登录',
  'system_notice.v3_journey.highlight_export': '导出为 PDF 相册书',
  'system_notice.v3_features.title': '3.0 版更多亮点',
  'system_notice.v3_features.body': '此版本还有一些其他值得了解的新功能。',
  'system_notice.v3_features.highlight_dashboard': '移动优先仪表板重设计',
  'system_notice.v3_features.highlight_offline': '作为 PWA 的完整离线模式',
  'system_notice.v3_features.highlight_search': '地点搜索实时自动补全',
  'system_notice.v3_features.highlight_import': '从 KMZ/KML 文件导入地点',
  'system_notice.v3_mcp.title': 'MCP：OAuth 2.1 升级',
  'system_notice.v3_mcp.body':
    'MCP 集成已全面重构。OAuth 2.1 现为推荐的身份验证方式。静态令牌（trek_…）已弃用，将在未来版本中移除。',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 推荐（mcp-remote）',
  'system_notice.v3_mcp.highlight_scopes': '24 个细粒度权限范围',
  'system_notice.v3_mcp.highlight_deprecated': '静态 trek_ 令牌已弃用',
  'system_notice.v3_mcp.highlight_tools': '扩展工具集与提示词',
  'system_notice.v3_thankyou.title': '来自我的一封私人信',
  'system_notice.v3_thankyou.body':
    '在你继续之前——我想停下来说几句。\n\nTREK 最初只是我为自己的旅行而做的一个业余项目。我从未想过它会成长为 4,000 人信赖的冒险规划工具。每一颗星标、每一个 issue、每一个功能请求——我都会读，它们在全职工作和大学学业之间的深夜里支撑着我继续前行。\n\n我想让你们知道：TREK 将永远开源，永远可自托管，永远属于你们。没有追踪，没有订阅，没有任何附加条件。只是一个热爱旅行的人为同样热爱旅行的你们打造的工具。\n\n特别感谢 [jubnl](https://github.com/jubnl)——你已经成为一位不可思议的合作者。3.0 版本中许多精彩之处都留下了你的印记。感谢你在这个项目还很粗糙的时候就选择了相信它。\n\n也感谢你们每一位——报告了 bug、翻译了文本、向朋友分享了 TREK，或者只是用它规划了一次旅行——**谢谢你们**。你们是这一切存在的原因。\n\n愿我们一起踏上更多的冒险旅程。\n\n— Maurice\n\n---\n\n[加入 Discord 社区](https://discord.gg/7Q6M6jDwzf)\n\n如果 TREK 让你的旅行更美好，一杯[小小的咖啡](https://ko-fi.com/mauriceboe)能让这盏灯一直亮着。',
  'system_notice.v3014_whitespace_collision.title': '需要操作：用户账户冲突',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 版本升级检测到一个或多个由存储账户中首尾空白字符引发的用户名或邮箱冲突。受影响的账户已自动重命名。请检查服务器日志中以 **[migration] WHITESPACE COLLISION** 开头的行，以确认哪些账户需要审查。',
};
export default system_notice;
