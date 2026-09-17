import { BedDouble, Check, ExternalLink, FileText, Plane, Wallet } from 'lucide-react';
import { packing, source } from './data';
import type { Saved } from './usePlanner';
export default function Details({ tab, saved, save }: { tab: string; saved: Saved; save: (x: Saved) => void }) {
  if (tab === '住宿')
    return (
      <div className="nz-detail-content">
        <div className="nz-section-heading">
          <BedDouble />
          <div>
            <h2>每一晚，都有归处</h2>
            <p>8 晚住宿 · 以下为原资料候选，尚未确认预订</p>
          </div>
        </div>
        {source.stays
          .filter((s) => s.city !== '飞机')
          .map((s) => (
            <article className="nz-detail-card" key={s.day}>
              <div className="nz-card-top">
                <span className="nz-pill">
                  {s.day} · {s.date}
                </span>
                <span className="nz-pending">待预订</span>
              </div>
              <h3>{s.city}</h3>
              <p className="nz-preline">{s.candidates || '原资料暂未提供候选住宿，可沿用皇后镇连住计划或补充酒店。'}</p>
              <a
                className="nz-text-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.city + ' hotels New Zealand')}`}
                target="_blank"
                rel="noreferrer"
              >
                查看该城市住宿 <ExternalLink size={13} />
              </a>
            </article>
          ))}
        <p className="nz-footnote">原资料中的报价仅为参考，币种、日期及是否含税未明确，不作为当前房价。</p>
      </div>
    );
  if (tab === '航班')
    return (
      <div className="nz-detail-content">
        <div className="nz-section-heading">
          <Plane />
          <div>
            <h2>从出发，到回家</h2>
            <p>10.30 — 11.09 · 时间按各机场当地时间</p>
          </div>
        </div>
        {[
          ['去程 · D1', '10 月 30 日', '上海浦东 T2', '广州白云 T2', '20:25', '23:10', 'CZ8212'],
          ['去程 · D2', '10 月 31 日', '广州白云 T2', '基督城', '00:50', '17:20', 'CZ617'],
          ['回程 · D10', '11 月 8—9 日', '基督城', '广州白云 T2', '22:30', '次日 05:20', 'CZ618'],
          ['回程 · D11', '11 月 9 日', '广州白云 T2', '上海虹桥 T2', '07:00', '09:15', 'CZ3533'],
        ].map((f) => (
          <article className="nz-detail-card" key={f[6]}>
            <div className="nz-card-top">
              <span className="nz-pill">
                {f[0]} · {f[1]}
              </span>
              <span>{f[6]}</span>
            </div>
            <div className="nz-flight">
              <div>
                <strong>{f[4]}</strong>
                <span>{f[2]}</span>
              </div>
              <Plane size={20} />
              <div>
                <strong>{f[5]}</strong>
                <span>{f[3]}</span>
              </div>
            </div>
          </article>
        ))}
        <div className="nz-tip">D2 抵达后在基督城住一晚；D3 早上开启南岛自驾。回程抵达上海虹桥，出发机场为浦东。</div>
        <p className="nz-footnote">航班信息取自《202611新西兰信息汇总》，尚未与航空公司订单实时核验。</p>
      </div>
    );
  if (tab === '清单')
    return (
      <div className="nz-detail-content">
        <div className="nz-section-heading">
          <Check />
          <div>
            <h2>把准备留在出发前</h2>
            <p>
              已完成 {saved.checked.length} / {packing.length} · 自动保存在此浏览器
            </p>
          </div>
        </div>
        <div className="nz-progress">
          <span style={{ width: `${(saved.checked.length / packing.length) * 100}%` }} />
        </div>
        {packing.map((item) => (
          <label className={`nz-check ${saved.checked.includes(item) ? 'done' : ''}`} key={item}>
            <input
              type="checkbox"
              checked={saved.checked.includes(item)}
              onChange={() =>
                save({
                  ...saved,
                  checked: saved.checked.includes(item)
                    ? saved.checked.filter((x) => x !== item)
                    : [...saved.checked, item],
                })
              }
            />
            <span>{item}</span>
          </label>
        ))}
        <div className="nz-detail-card">
          <h3>
            <Wallet size={18} /> 已记录费用
          </h3>
          <dl className="nz-costs">
            <div>
              <dt>机票 · 2 人</dt>
              <dd>13,290</dd>
            </div>
            <div>
              <dt>签证</dt>
              <dd>3,925</dd>
            </div>
            <div>
              <dt>租车 · 8 天全险</dt>
              <dd>4,135</dd>
            </div>
            <div>
              <dt>小计</dt>
              <dd>21,350</dd>
            </div>
          </dl>
          <p className="nz-footnote">沿用原资料金额；币种未标明。住宿、门票、餐饮等尚未计入，非完整预算。</p>
        </div>
      </div>
    );
  return (
    <div className="nz-detail-content">
      <div className="nz-section-heading">
        <FileText />
        <div>
          <h2>旅程的资料夹</h2>
          <p>所有行程来自 NZ 目录中的原始资料</p>
        </div>
      </div>
      {source.sources.map((s, i) => (
        <div className="nz-source" key={s}>
          <span>0{i + 1}</span>
          {s}
        </div>
      ))}
      <div className="nz-detail-card">
        <h3>整理说明</h3>
        <p>
          每日时间、里程优先采用自驾详细行程表；航班和待办来自信息汇总。地点使用手工整理的近似坐标。主要自驾路段沿 OSRM
          / OpenStreetMap 道路参考线展示；飞行与镇内活动使用顺序示意线，不提供实时路况。
        </p>
        <p>观星、冰川徒步、跳伞的集合点尚待订单确认；住宿均为候选。D9 使用 286 km，保留文档 306 km 的差异说明。</p>
        <a
          className="nz-text-link"
          href="https://www.newzealand.com/us/feature/south-island-alpine-lakes-itinerary/"
          target="_blank"
          rel="noreferrer"
        >
          新西兰旅游局 · 南岛湖区参考 <ExternalLink size={13} />
        </a>
      </div>
      <p className="nz-footnote">个人备注和清单仅保存在当前浏览器，可导出 JSON 留存。地图底图需联网。</p>
    </div>
  );
}
