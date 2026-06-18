import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': '行程',
  'oauth.scope.group.places': '地点',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': '行李',
  'oauth.scope.group.todos': '待办事项',
  'oauth.scope.group.budget': '预算',
  'oauth.scope.group.reservations': '预订',
  'oauth.scope.group.collab': '协作',
  'oauth.scope.group.notifications': '通知',
  'oauth.scope.group.vacay': '假期',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': '天气',
  'oauth.scope.group.journey': '旅程',
  'oauth.scope.trips:read.label': '查看行程和行程计划',
  'oauth.scope.trips:read.description': '读取行程、天数、每日笔记和成员',
  'oauth.scope.trips:write.label': '编辑行程和行程计划',
  'oauth.scope.trips:write.description': '创建和更新行程、天数、笔记并管理成员',
  'oauth.scope.trips:delete.label': '删除行程',
  'oauth.scope.trips:delete.description': '永久删除整个行程——此操作不可撤销',
  'oauth.scope.trips:share.label': '管理分享链接',
  'oauth.scope.trips:share.description': '创建、更新和撤销行程的公开分享链接',
  'oauth.scope.places:read.label': '查看地点和地图数据',
  'oauth.scope.places:read.description': '读取地点、每日分配、标签和分类',
  'oauth.scope.places:write.label': '管理地点',
  'oauth.scope.places:write.description': '创建、更新和删除地点、分配和标签',
  'oauth.scope.atlas:read.label': '查看 Atlas',
  'oauth.scope.atlas:read.description': '读取已访问国家、地区和心愿清单',
  'oauth.scope.atlas:write.label': '管理 Atlas',
  'oauth.scope.atlas:write.description': '标记已访问国家和地区，管理心愿清单',
  'oauth.scope.packing:read.label': '查看行李清单',
  'oauth.scope.packing:read.description': '读取行李物品、包袋和分类负责人',
  'oauth.scope.packing:write.label': '管理行李清单',
  'oauth.scope.packing:write.description': '添加、更新、删除、勾选和重新排列行李物品和包袋',
  'oauth.scope.todos:read.label': '查看待办清单',
  'oauth.scope.todos:read.description': '读取行程待办事项和分类负责人',
  'oauth.scope.todos:write.label': '管理待办清单',
  'oauth.scope.todos:write.description': '创建、更新、勾选、删除和重新排列待办事项',
  'oauth.scope.budget:read.label': '查看预算',
  'oauth.scope.budget:read.description': '读取预算条目和费用明细',
  'oauth.scope.budget:write.label': '管理预算',
  'oauth.scope.budget:write.description': '创建、更新和删除预算条目',
  'oauth.scope.reservations:read.label': '查看预订',
  'oauth.scope.reservations:read.description': '读取预订和住宿详情',
  'oauth.scope.reservations:write.label': '管理预订',
  'oauth.scope.reservations:write.description': '创建、更新、删除和重新排列预订',
  'oauth.scope.collab:read.label': '查看协作',
  'oauth.scope.collab:read.description': '读取协作笔记、投票和消息',
  'oauth.scope.collab:write.label': '管理协作',
  'oauth.scope.collab:write.description': '创建、更新和删除协作笔记、投票和消息',
  'oauth.scope.notifications:read.label': '查看通知',
  'oauth.scope.notifications:read.description': '读取应用内通知和未读数量',
  'oauth.scope.notifications:write.label': '管理通知',
  'oauth.scope.notifications:write.description': '将通知标记为已读并回复',
  'oauth.scope.vacay:read.label': '查看假期计划',
  'oauth.scope.vacay:read.description': '读取假期计划数据、条目和统计',
  'oauth.scope.vacay:write.label': '管理假期计划',
  'oauth.scope.vacay:write.description': '创建和管理假期条目、节假日和团队计划',
  'oauth.scope.geo:read.label': '地图和地理编码',
  'oauth.scope.geo:read.description': '搜索位置、解析地图 URL 和反向地理编码坐标',
  'oauth.scope.weather:read.label': '天气预报',
  'oauth.scope.weather:read.description': '获取行程地点和日期的天气预报',
  'oauth.scope.journey:read.label': '查看旅程',
  'oauth.scope.journey:read.description': '读取旅程、条目和贡献者列表',
  'oauth.scope.journey:write.label': '管理旅程',
  'oauth.scope.journey:write.description': '创建、更新和删除旅程及其条目',
  'oauth.scope.journey:share.label': '管理旅程链接',
  'oauth.scope.journey:share.description': '创建、更新和撤销旅程的公开分享链接',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
