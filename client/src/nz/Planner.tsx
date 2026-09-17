import {
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  FolderOpen,
  ListChecks,
  Map,
  MapPin,
  Mountain,
  Navigation,
  NotebookPen,
  Plane,
  Search,
  X,
} from 'lucide-react';
import { days, mapsUrl, routeUrl } from './data';
import Details from './Details';
import TripMap from './TripMap';
import { usePlanner } from './usePlanner';
const tabs = [
  { name: '行程', icon: CalendarDays },
  { name: '住宿', icon: BedDouble },
  { name: '航班', icon: Plane },
  { name: '清单', icon: ListChecks },
  { name: '资料', icon: FolderOpen },
];
export default function Planner() {
  const p = usePlanner(),
    { day } = p;
  const filtered = day.stops.filter((s) =>
    (s.place.name + s.place.en + s.detail).toLowerCase().includes(p.query.toLowerCase())
  );
  return (
    <div className="nz-app">
      <aside className="nz-rail">
        <a className="nz-logo" href={`${import.meta.env.BASE_URL}nz.html`} aria-label="TREK 首页">
          <Mountain size={28} />
          <strong>
            trek<span>®</span>
          </strong>
        </a>
        <div className="nz-rail-divider" />
        {tabs.map((t) => (
          <button
            key={t.name}
            className={p.tab === t.name ? 'active' : ''}
            onClick={() => p.setTab(t.name)}
            title={t.name}
          >
            <t.icon size={21} />
            <span>{t.name}</span>
          </button>
        ))}
        <div className="nz-rail-bottom">
          <span className="nz-avatar">NZ</span>
          <small>我们的旅行</small>
        </div>
      </aside>
      <div className="nz-workspace">
        <header className="nz-header">
          <div className="nz-breadcrumb">
            我的旅行 <ChevronRight size={13} />
            <span>新西兰南岛</span>
          </div>
          <div className="nz-header-actions">
            <span className="nz-private">
              <span />
              个人旅行工作台
            </span>
            <button className="nz-export" onClick={p.download}>
              <Download size={15} />
              导出行程
            </button>
          </div>
        </header>
        <section className="nz-trip-hero">
          <div>
            <div className="nz-eyebrow">
              AOTEAROA / NEW ZEALAND <span>2026</span>
            </div>
            <h1>
              南岛，慢慢走<span className="nz-spark">✳</span>
            </h1>
            <p>从奶蓝色湖泊到雪山峡湾，把每一天交给风景。</p>
            <div className="nz-trip-meta">
              <span>
                <CalendarDays size={14} />
                10 月 30 日 — 11 月 9 日
              </span>
              <span>
                <MapPin size={14} />
                新西兰 · 南岛
              </span>
              <span>2 人同行</span>
            </div>
          </div>
          <div className="nz-trip-numbers">
            <div>
              <strong>
                11<span>天</span>
              </strong>
              <small>完整旅程</small>
            </div>
            <div>
              <strong>
                8<span>天</span>
              </strong>
              <small>南岛探索</small>
            </div>
            <div>
              <strong>
                1,276<span>km</span>
              </strong>
              <small>已列自驾里程 ≈</small>
            </div>
          </div>
        </section>
        <div className="nz-day-strip">
          <button
            className={`nz-overview ${p.overview ? 'active' : ''}`}
            onClick={() => {
              p.setOverview(!p.overview);
              p.selectPlace(null);
            }}
          >
            <Map size={19} />
            <span>全程总览</span>
          </button>
          <div className="nz-days">
            {days.map((d) => (
              <button
                key={d.id}
                aria-pressed={d.id === day.id && !p.overview}
                className={d.id === day.id && !p.overview ? 'active' : ''}
                onClick={() => p.selectDay(d.id)}
              >
                <span>
                  DAY {d.id}
                  <small>{d.weekday}</small>
                </span>
                <strong>{d.date}</strong>
                <small>{d.city}</small>
              </button>
            ))}
          </div>
        </div>
        <main className="nz-main">
          <section className="nz-panel">
            <div className="nz-panel-tabs">
              {tabs.map((t) => (
                <button className={p.tab === t.name ? 'active' : ''} onClick={() => p.setTab(t.name)} key={t.name}>
                  {t.name}
                </button>
              ))}
            </div>
            {p.tab === '行程' ? (
              <>
                <div className="nz-day-heading">
                  <div className="nz-overline">
                    {p.overview ? 'SOUTH ISLAND ROAD TRIP' : `DAY ${day.id} / ${day.date} ${day.weekday}`}
                  </div>
                  <h2>{p.overview ? '一路向风景' : day.title}</h2>
                  <p>{p.overview ? '选择一天，展开属于这一天的旅程。' : day.subtitle}</p>
                  {!p.overview && (
                    <div className="nz-day-stats">
                      <span>
                        {day.mode === 'flight' ? <Plane size={14} /> : <Car size={14} />}{' '}
                        {day.km ? `约 ${day.km} km` : day.mode === 'flight' ? '往返观光飞行' : '镇内活动'}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        {day.duration}
                      </span>
                    </div>
                  )}
                </div>
                {p.overview ? (
                  <div className="nz-overview-list">
                    {days.map((d) => (
                      <button key={d.id} onClick={() => p.selectDay(d.id)}>
                        <span>D{d.id}</span>
                        <div>
                          <strong>{d.title}</strong>
                          <small>
                            {d.date} · {d.subtitle}
                          </small>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <label className="nz-search">
                      <Search size={16} />
                      <input
                        placeholder="搜索当天地点或活动"
                        value={p.query}
                        onChange={(e) => p.setQuery(e.target.value)}
                      />
                      {p.query && (
                        <button aria-label="清除搜索" onClick={() => p.setQuery('')}>
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <div className="nz-timeline">
                      {filtered.map((s) => (
                        <article
                          key={`${day.id}-${day.stops.indexOf(s)}`}
                          className={`nz-stop ${p.focus?.id === s.place.id ? 'selected' : ''}`}
                        >
                          <button
                            className="nz-stop-number"
                            onClick={() => p.selectPlace(s.place)}
                            aria-label={`定位${s.place.name}`}
                          >
                            {day.stops
                              .filter((x, j, a) => a.findIndex((y) => y.place.id === x.place.id) === j)
                              .findIndex((x) => x.place.id === s.place.id) + 1}
                          </button>
                          <div className="nz-stop-body">
                            <div className="nz-stop-time">
                              <span>{s.time}</span>
                              <span className="nz-category">{s.category}</span>
                            </div>
                            <button className="nz-stop-title" onClick={() => p.selectPlace(s.place)}>
                              {s.place.name}
                              <ArrowUpRight size={16} />
                            </button>
                            <div className="nz-english">{s.place.en}</div>
                            <p>{s.detail}</p>
                            <div className="nz-stop-footer">
                              {s.place.approximate ? <span>集合点 / 坐标待确认</span> : <span>点击名称在地图定位</span>}
                              <a href={mapsUrl(s.place)} target="_blank" rel="noreferrer">
                                <Navigation size={12} />
                                导航
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                      {!filtered.length && (
                        <div className="nz-empty">
                          <Search />
                          <p>当天没有匹配的地点</p>
                          <button onClick={() => p.setQuery('')}>显示全部行程</button>
                        </div>
                      )}
                    </div>
                    <div className="nz-tip">
                      <Compass size={17} />
                      <p>{day.note}</p>
                    </div>
                    <div className="nz-notes">
                      <label htmlFor="day-note">
                        <NotebookPen size={16} />
                        我的当天备注 <span>自动保存</span>
                      </label>
                      <textarea
                        id="day-note"
                        placeholder="记下预订编号、集合时间，或想去的小店……"
                        value={p.saved.notes[day.id] || ''}
                        onChange={(e) => p.save({ ...p.saved, notes: { ...p.saved.notes, [day.id]: e.target.value } })}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <Details tab={p.tab} saved={p.saved} save={p.save} />
            )}
            <footer className="nz-panel-footer">
              <button aria-label="前一天" disabled={day.id === 3} onClick={() => p.selectDay(day.id - 1)}>
                <ChevronLeft size={18} />
              </button>
              <span>
                DAY {day.id} <span>/ 10</span>
              </span>
              <button aria-label="后一天" disabled={day.id === 10} onClick={() => p.selectDay(day.id + 1)}>
                <ChevronRight size={18} />
              </button>
              {day.mode !== 'flight' && (
                <a href={routeUrl(day)} target="_blank" rel="noreferrer">
                  打开当日导航
                  <ArrowUpRight size={15} />
                </a>
              )}
            </footer>
          </section>
          <div className="nz-map-panel">
            <TripMap day={day} overview={p.overview} focus={p.focus} onSelect={p.selectPlace} />
            {p.focus && (
              <div className="nz-place-card">
                <span className="nz-place-icon">
                  <MapPin />
                </span>
                <div>
                  <strong>{p.focus.name}</strong>
                  <small>
                    {p.focus.en}
                    {p.focus.approximate ? ' · 近似位置' : ''}
                  </small>
                </div>
                <a aria-label="打开地点导航" href={mapsUrl(p.focus)} target="_blank" rel="noreferrer">
                  <ArrowUpRight size={21} />
                </a>
                <button aria-label="关闭地点详情" onClick={() => p.selectPlace(null)}>
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="nz-map-caption">
              <span>
                <span className="nz-dot" />
                你的南岛故事，从这里开始
              </span>
              <small>地图可缩放、拖动 · 点击地点查看详情</small>
            </div>
          </div>
        </main>
      </div>
      {(p.storageError || p.notice) && (
        <div className="nz-toast" role="status">
          {p.storageError || p.notice}
        </div>
      )}
    </div>
  );
}
