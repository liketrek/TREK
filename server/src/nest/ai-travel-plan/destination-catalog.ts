/**
 * The curated destinations the planner may suggest when the traveller has no
 * city in mind. Every entry is a real Chinese city with WGS-84 coordinates;
 * the recommender still validates a shortlist against the map provider before
 * showing it, so a stale coordinate can never become a suggestion.
 *
 * `tier` also drives the budget estimator's rate table. `interests` are free
 * tags matched against the traveller's words, not provider categories.
 */
export type CityTier = 1 | 2 | 3;

export interface DestinationProfile {
  id: string;
  name: string;
  region: string;
  aliases: string[];
  lat: number;
  lng: number;
  tier: CityTier;
  interests: string[];
  /** Months (1–12) when this destination is at its best. */
  bestMonths: number[];
}

export const DESTINATION_CATALOG: DestinationProfile[] = [
  {
    id: 'beijing',
    name: '北京',
    region: '华北',
    aliases: ['帝都'],
    lat: 39.9042,
    lng: 116.4074,
    tier: 1,
    interests: ['历史', '博物馆', '公园', '美食', '胡同'],
    bestMonths: [4, 5, 9, 10],
  },
  {
    id: 'shanghai',
    name: '上海',
    region: '华东',
    aliases: ['魔都'],
    lat: 31.2304,
    lng: 121.4737,
    tier: 1,
    interests: ['城市', '博物馆', '购物', '美食', '夜景'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'guangzhou',
    name: '广州',
    region: '华南',
    aliases: ['羊城'],
    lat: 23.1291,
    lng: 113.2644,
    tier: 1,
    interests: ['美食', '购物', '公园', '历史'],
    bestMonths: [10, 11, 12, 3],
  },
  {
    id: 'shenzhen',
    name: '深圳',
    region: '华南',
    aliases: ['鹏城'],
    lat: 22.5431,
    lng: 114.0579,
    tier: 1,
    interests: ['城市', '购物', '海滨', '亲子'],
    bestMonths: [10, 11, 12, 3],
  },
  {
    id: 'hangzhou',
    name: '杭州',
    region: '华东',
    aliases: ['杭城'],
    lat: 30.2741,
    lng: 120.1551,
    tier: 1,
    interests: ['西湖', '园林', '公园', '美食', '茶'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'chengdu',
    name: '成都',
    region: '西南',
    aliases: ['蓉城'],
    lat: 30.5728,
    lng: 104.0668,
    tier: 1,
    interests: ['熊猫', '美食', '公园', '博物馆', '休闲'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'chongqing',
    name: '重庆',
    region: '西南',
    aliases: ['山城'],
    lat: 29.563,
    lng: 106.5516,
    tier: 1,
    interests: ['山城', '夜景', '美食', '历史'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'xian',
    name: '西安',
    region: '西北',
    aliases: ['长安'],
    lat: 34.3416,
    lng: 108.9398,
    tier: 1,
    interests: ['历史', '博物馆', '美食', '古城'],
    bestMonths: [3, 4, 5, 9, 10],
  },
  {
    id: 'nanjing',
    name: '南京',
    region: '华东',
    aliases: ['金陵'],
    lat: 32.0603,
    lng: 118.7969,
    tier: 1,
    interests: ['历史', '博物馆', '公园', '美食'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'suzhou',
    name: '苏州',
    region: '华东',
    aliases: ['姑苏'],
    lat: 31.2989,
    lng: 120.5853,
    tier: 1,
    interests: ['园林', '古城', '博物馆', '美食'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'wuhan',
    name: '武汉',
    region: '华中',
    aliases: ['江城'],
    lat: 30.5928,
    lng: 114.3055,
    tier: 1,
    interests: ['历史', '博物馆', '公园', '美食', '樱花'],
    bestMonths: [3, 4, 5, 9, 10],
  },
  {
    id: 'changsha',
    name: '长沙',
    region: '华中',
    aliases: ['星城'],
    lat: 28.2282,
    lng: 112.9388,
    tier: 2,
    interests: ['美食', '夜市', '历史', '公园'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'xiamen',
    name: '厦门',
    region: '华东',
    aliases: ['鹭岛'],
    lat: 24.4798,
    lng: 118.0894,
    tier: 1,
    interests: ['海滨', '海岛', '美食', '文艺', '亲子'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'qingdao',
    name: '青岛',
    region: '华东',
    aliases: ['岛城'],
    lat: 36.0671,
    lng: 120.3826,
    tier: 2,
    interests: ['海滨', '啤酒', '历史', '建筑'],
    bestMonths: [5, 6, 7, 8, 9, 10],
  },
  {
    id: 'kunming',
    name: '昆明',
    region: '西南',
    aliases: ['春城'],
    lat: 25.0389,
    lng: 102.7183,
    tier: 2,
    interests: ['气候', '公园', '美食', '花'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'dali',
    name: '大理',
    region: '西南',
    aliases: [],
    lat: 25.6065,
    lng: 100.2676,
    tier: 2,
    interests: ['古城', '洱海', '山水', '休闲'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'lijiang',
    name: '丽江',
    region: '西南',
    aliases: [],
    lat: 26.8721,
    lng: 100.2299,
    tier: 2,
    interests: ['古城', '雪山', '休闲', '摄影'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'sanya',
    name: '三亚',
    region: '华南',
    aliases: ['鹿城'],
    lat: 18.2528,
    lng: 109.5119,
    tier: 1,
    interests: ['海滨', '海岛', '亲子', '度假'],
    bestMonths: [10, 11, 12, 1, 2, 3, 4],
  },
  {
    id: 'guilin',
    name: '桂林',
    region: '华南',
    aliases: [],
    lat: 25.2736,
    lng: 110.29,
    tier: 2,
    interests: ['山水', '漓江', '摄影', '休闲'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'guiyang',
    name: '贵阳',
    region: '西南',
    aliases: [],
    lat: 26.647,
    lng: 106.6302,
    tier: 2,
    interests: ['山水', '瀑布', '美食', '避暑'],
    bestMonths: [5, 6, 7, 8, 9, 10],
  },
  {
    id: 'harbin',
    name: '哈尔滨',
    region: '东北',
    aliases: ['冰城'],
    lat: 45.8038,
    lng: 126.535,
    tier: 2,
    interests: ['冰雪', '建筑', '美食', '冬季'],
    bestMonths: [12, 1, 2, 6, 7, 8],
  },
  {
    id: 'dalian',
    name: '大连',
    region: '东北',
    aliases: [],
    lat: 38.914,
    lng: 121.6147,
    tier: 2,
    interests: ['海滨', '广场', '美食', '亲子'],
    bestMonths: [5, 6, 7, 8, 9, 10],
  },
  {
    id: 'zhangjiajie',
    name: '张家界',
    region: '华中',
    aliases: ['武陵源'],
    lat: 29.117,
    lng: 110.4792,
    tier: 2,
    interests: ['山水', '森林公园', '徒步', '摄影'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'huangshan',
    name: '黄山',
    region: '华东',
    aliases: [],
    lat: 29.7147,
    lng: 118.3376,
    tier: 2,
    interests: ['山水', '古村', '摄影', '徒步'],
    bestMonths: [3, 4, 5, 9, 10, 11],
  },
  {
    id: 'xining',
    name: '西宁',
    region: '西北',
    aliases: [],
    lat: 36.6171,
    lng: 101.7782,
    tier: 2,
    interests: ['高原', '湖泊', '寺庙', '避暑'],
    bestMonths: [6, 7, 8, 9],
  },
  {
    id: 'lhasa',
    name: '拉萨',
    region: '西南',
    aliases: ['日光城'],
    lat: 29.652,
    lng: 91.1721,
    tier: 2,
    interests: ['高原', '寺庙', '雪山', '摄影'],
    bestMonths: [5, 6, 7, 8, 9, 10],
  },
  {
    id: 'urumqi',
    name: '乌鲁木齐',
    region: '西北',
    aliases: ['乌市'],
    lat: 43.8256,
    lng: 87.6168,
    tier: 2,
    interests: ['新疆', '美食', '雪山', '草原'],
    bestMonths: [6, 7, 8, 9, 10],
  },
];

/** Strip the administrative suffix a traveller usually omits or adds. */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s·・]/g, '')
    .replace(/(特别行政区|自治区|自治州|地区|市|县|区)$/u, '');
}

/** The catalog entry a destination string names, or null when none matches. */
function findDestinationProfile(destination: string | undefined): DestinationProfile | null {
  if (!destination) return null;
  const value = normalize(destination);
  if (value === '') return null;
  const exact = DESTINATION_CATALOG.find(
    (entry) => normalize(entry.name) === value || entry.aliases.some((alias) => normalize(alias) === value),
  );
  if (exact) return exact;
  // "杭州市西湖区" still names 杭州; prefer the longest matching name so a
  // short alias cannot shadow a more specific destination.
  return (
    [...DESTINATION_CATALOG]
      .sort((a, b) => b.name.length - a.name.length)
      .find(
        (entry) =>
          value.includes(normalize(entry.name)) ||
          entry.aliases.some((alias) => normalize(alias).length >= 2 && value.includes(normalize(alias))),
      ) ?? null
  );
}

/** The destination's price tier; an unknown destination is priced as tier 2. */
export function cityTierOf(destination: string | undefined): CityTier {
  return findDestinationProfile(destination)?.tier ?? 2;
}
