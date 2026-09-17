import source from './source-data.json';
export type Place = { id: string; name: string; en: string; position: [number, number]; approximate?: boolean };
const p = (id: string, name: string, en: string, lat: number, lng: number, approximate = false): Place => ({
  id,
  name,
  en,
  position: [lat, lng],
  approximate,
});
export const places = {
  chc: p('chc', '基督城', 'Christchurch', -43.5309, 172.6365),
  airport: p('airport', '基督城机场', 'Christchurch Airport', -43.4894, 172.5322),
  tekapo: p('tekapo', '蒂卡波湖', 'Lake Tekapo', -44.0047, 170.4771),
  church: p('church', '好牧羊人教堂', 'Church of the Good Shepherd', -44.0033, 170.4829),
  stars: p('stars', '蒂卡波观星', 'Tekapo Stargazing', -44.0047, 170.4771, true),
  pukaki: p('pukaki', '普卡基湖观景', 'Peter’s Lookout', -44.1059, 170.1325, true),
  cook: p('cook', '库克山 · 冰川徒步', 'Aoraki / Mount Cook Village', -43.7344, 170.0969, true),
  twizel: p('twizel', '特威泽尔', 'Twizel', -44.2575, 170.0992),
  wanaka: p('wanaka', '瓦纳卡', 'Wānaka', -44.6969, 169.1359),
  tree: p('tree', '孤独之树', 'That Wānaka Tree', -44.6982, 169.1177),
  guns: p('guns', '真枪射击', 'Real Guns NZ, Cardrona Valley Road', -44.765, 169.057, true),
  cardrona: p('cardrona', '卡德罗纳胸罩围栏', 'Cardrona Bra Fence', -44.8796, 169.0035, true),
  arrow: p('arrow', '箭镇', 'Arrowtown', -44.9387, 168.8356),
  queen: p('queen', '皇后镇', 'Queenstown', -45.0312, 168.6626),
  glen: p('glen', '格林诺奇步道', 'Glenorchy Walkway', -44.8503, 168.3835),
  bluff: p('bluff', '湖畔观景台', 'Bennett’s Bluff Lookout', -44.9964, 168.4064, true),
  skyline: p('skyline', '天空缆车', 'Skyline Queenstown', -45.027, 168.6569),
  skydive: p('skydive', '高空跳伞', 'Queenstown Skydiving', -45.0312, 168.6626, true),
  burger: p('burger', '大脸汉堡', 'Fergburger', -45.031, 168.6609),
  lake: p('lake', '瓦卡蒂普湖畔', 'Queenstown Bay', -45.0344, 168.6601),
  zqn: p('zqn', '皇后镇机场', 'Queenstown Airport', -45.0211, 168.7392),
  milford: p('milford', '米尔福德峡湾', 'Milford Sound', -44.6717, 167.9256),
  cromwell: p('cromwell', '水果小镇', 'Cromwell', -45.0389, 169.1989),
  oamaru: p('oamaru', '奥马鲁历史街区', 'Oamaru Victorian Precinct', -45.1025, 170.9685),
  penguin: p('penguin', '小蓝企鹅归巢', 'Oamaru Blue Penguin Colony', -45.1114, 170.9806),
  gardens: p('gardens', '基督城植物园', 'Christchurch Botanic Gardens', -43.5302, 172.6203),
};
export type Stop = { place: Place; time: string; detail: string; category: string };
export type Day = {
  id: number;
  date: string;
  weekday: string;
  title: string;
  subtitle: string;
  km: number;
  duration: string;
  city: string;
  mode: 'drive' | 'flight' | 'walk';
  stops: Stop[];
  note: string;
};
const s = (key: keyof typeof places, time: string, detail: string, category = '探索'): Stop => ({
  place: places[key],
  time,
  detail,
  category,
});
export const days: Day[] = [
  {
    id: 3,
    date: '11.01',
    weekday: '周日',
    title: '奔向奶蓝色的湖',
    subtitle: '基督城 → 蒂卡波',
    km: 238,
    duration: '3 小时',
    city: 'Tekapo',
    mode: 'drive',
    note: '20:00 以后的观星安排取决于预订场次、天气与日落时间。集合地点待确认。',
    stops: [
      s('chc', '09:00–12:30', '提车出发，穿越坎特伯雷大平原。', '自驾'),
      s('tekapo', '12:30–14:00', '抵达蒂卡波，在湖边享用午餐。', '午餐'),
      s('church', '14:00–16:30', '好牧羊人教堂与湖畔漫步，留一些时间拍照。'),
      s('tekapo', '16:30–19:30', '办理入住、休息和晚餐。', '住宿'),
      s('stars', '20:00 以后', '参加观星团，具体场次与集合点以订单为准。', '体验'),
    ],
  },
  {
    id: 4,
    date: '11.02',
    weekday: '周一',
    title: '雪山、冰川与远方',
    subtitle: '蒂卡波 → 库克山 → 瓦纳卡',
    km: 326,
    duration: '4 小时',
    city: 'Wānaka',
    mode: 'drive',
    note: '冰川徒步尚未确认运营商与集合点，地图暂定位库克山村。当天安排较满，请为体验和停靠预留时间。',
    stops: [
      s('tekapo', '08:30', '从蒂卡波出发。', '自驾'),
      s('pukaki', '08:30–09:45', '途经普卡基湖，在 Peter’s Lookout 拍雪山倒影。'),
      s('cook', '10:00–14:00', '塔斯曼冰川直升机徒步，预留 3–4 小时。', '体验'),
      s('cook', '14:00–15:00', '库克山村午餐。', '午餐'),
      s('twizel', '15:00–18:00', '向瓦纳卡出发，途中可在 Twizel 补给。', '自驾'),
      s('wanaka', '18:00 左右', '抵达瓦纳卡并入住。', '住宿'),
    ],
  },
  {
    id: 5,
    date: '11.03',
    weekday: '周二',
    title: '沿山路，去皇后镇',
    subtitle: '瓦纳卡 → 卡德罗纳 → 箭镇',
    km: 75,
    duration: '1 小时 20 分',
    city: 'Queenstown',
    mode: 'drive',
    note: '原资料里程约 75 km；实际途经射击场与箭镇可能增加里程。射击场地址待订单核实，皇冠山脉公路预留额外驾驶时间。',
    stops: [
      s('tree', '09:00–10:30', '瓦纳卡湖边散步，顺路打卡孤独之树。'),
      s('guns', '10:45–12:45', 'Real Guns NZ 真枪射击，具体地址待确认。', '体验'),
      s('cardrona', '12:45–13:00', '顺路停靠卡德罗纳胸罩围栏。'),
      s('arrow', '14:00–16:30', '翻越皇冠山脉后，在箭镇午餐、漫步历史街区。'),
      s('queen', '16:30–17:00', '开往皇后镇，入住后逛逛镇中心。', '住宿'),
    ],
  },
  {
    id: 6,
    date: '11.04',
    weekday: '周三',
    title: '走进魔戒的风景',
    subtitle: '皇后镇 ⇄ 格林诺奇',
    km: 94,
    duration: '1 小时 40 分',
    city: 'Queenstown',
    mode: 'drive',
    note: '缆车原计划为 17:30–18:00，日落时刻尚待核实；请以当天日落时间调整停留。',
    stops: [
      s('queen', '09:00', '沿瓦卡蒂普湖出发。', '自驾'),
      s('glen', '10:00–12:30', '漫步湿地步道、红房子，午餐后返程。', '徒步'),
      s('bluff', '14:00–15:30', '返回皇后镇，途经湖畔观景台停靠拍照。'),
      s('skyline', '17:30–18:00', '乘天空缆车，欣赏皇后镇全景与夜色。', '体验'),
    ],
  },
  {
    id: 7,
    date: '11.05',
    weekday: '周四',
    title: '把心跳留在天空',
    subtitle: '皇后镇 · 自由探索',
    km: 0,
    duration: '镇内短途',
    city: 'Queenstown',
    mode: 'walk',
    note: '跳伞运营商与集合地点待预订确认；地图暂使用皇后镇中心。下午保留自由活动时间。',
    stops: [
      s('skydive', '08:30–12:00', '参加早场高空跳伞。', '体验'),
      s('burger', '12:30–13:30', '品尝 Fergburger，预留排队时间。', '美食'),
      s('lake', '14:00 以后', '湖边散步、购买伴手礼，慢慢度过下午。', '自由活动'),
    ],
  },
  {
    id: 8,
    date: '11.06',
    weekday: '周五',
    title: '从云端抵达峡湾',
    subtitle: '皇后镇 ⇄ 米尔福德峡湾',
    km: 0,
    duration: '飞行 + 游船',
    city: 'Queenstown',
    mode: 'flight',
    note: '固定翼飞行与约 2 小时游船，非公路自驾。起飞时刻、运营商与天气备选安排待确认。',
    stops: [
      s('zqn', '按预订时间', '在皇后镇机场办理观光飞行手续。', '飞行'),
      s('milford', '全天体验', '固定翼观光飞行与峡湾游船，俯瞰冰川和峡湾。', '游船'),
      s('zqn', '按预订时间', '飞回皇后镇机场，返回住宿休息。', '飞行'),
    ],
  },
  {
    id: 9,
    date: '11.07',
    weekday: '周六',
    title: '去海边，等企鹅回家',
    subtitle: '皇后镇 → 奥马鲁',
    km: 286,
    duration: '3 小时 30 分',
    city: 'Oamaru',
    mode: 'drive',
    note: '里程采用详细行程表的 286 km；行程文档同时出现 306 km。企鹅入场与归巢时间以预订通知为准。',
    stops: [
      s('queen', '09:30', '悠闲退房，沿 8 号转 83 号公路向东海岸出发。', '自驾'),
      s('cromwell', '途中停靠', '水果小镇短暂休息、补给。'),
      s('oamaru', '14:30–17:30', '入住后逛维多利亚历史街区、古董店与画廊。'),
      s('penguin', '20:00 以后', '看小蓝企鹅归巢，待预订看台门票。', '体验'),
    ],
  },
  {
    id: 10,
    date: '11.08',
    weekday: '周日',
    title: '最后一程，带风景回家',
    subtitle: '奥马鲁 → 基督城 → 上海',
    km: 257,
    duration: '3 小时 15 分',
    city: '夜间航班',
    mode: 'drive',
    note: '22:30 从基督城起飞，经广州返回上海。航班资料来自提供的文档，出行前请核对订单。',
    stops: [
      s('oamaru', '09:30–12:45', '沿东海岸 1 号公路返回基督城。', '自驾'),
      s('gardens', '13:00–16:30', '午餐后游览植物园和雅芳河，或选择纸板大教堂。'),
      s('chc', '17:00–17:30', '在市区享用晚餐。', '晚餐'),
      s('airport', '18:00–18:30', '前往机场附近还车，随后值机安检。', '还车'),
      s('airport', '22:30', 'CZ618 飞往广州，次日转乘 CZ3533 回上海。', '航班'),
    ],
  },
];
export { source };
export const packing = [
  '打印 A4 提车单',
  '准备驾照翻译件',
  '准备符合租车要求的实体信用卡',
  '确认 8 晚住宿',
  '预订蒂卡波观星团',
  '预订冰川直升机徒步',
  '预订真枪射击体验',
  '预订天空缆车',
  '预订跳伞并确认集合点',
  '预订峡湾飞行与游船',
  '预订小蓝企鹅门票',
  '复核航班与还车时间',
];
export function mapsUrl(place: Place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.en + ', New Zealand')}`;
}
export function routeUrl(day: Day) {
  const ps = day.stops
    .filter((s, i, a) => i === 0 || s.place.id !== a[i - 1].place.id)
    .map((s) => s.place.en + ', New Zealand');
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ps[0])}&destination=${encodeURIComponent(ps.at(-1)!)}&waypoints=${encodeURIComponent(ps.slice(1, -1).join('|'))}&travelmode=${day.mode === 'walk' ? 'walking' : 'driving'}`;
}
