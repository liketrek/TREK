import L from 'leaflet';
import { Layers, LocateFixed, Map as MapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { days, type Day, type Place } from './data';
import roadRoutes from './road-routes.json';
const roads: Record<string, { positions: [number, number][] }> = Object.fromEntries(
  Object.entries(roadRoutes).map(([id, route]) => [
    id,
    { positions: route.positions.map(([lat, lng]): [number, number] => [lat, lng]) },
  ])
);
const colors = ['#397766', '#548da7', '#a5844a', '#688c63', '#a5767c', '#777bb0', '#bf855f', '#687f98'];
function Viewport({
  day,
  overview,
  focus,
  reset,
}: {
  day: Day;
  overview: boolean;
  focus: Place | null;
  reset: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.stop();
    if (focus) map.setView(focus.position, Math.max(map.getZoom(), focus.approximate ? 11 : 14), { animate: false });
    else
      map.fitBounds(
        L.latLngBounds((overview ? days.flatMap((d) => d.stops) : day.stops).map((s) => s.place.position)),
        { padding: [55, 65], maxZoom: 14, animate: false }
      );
  }, [map, day, overview, focus, reset]);
  useEffect(() => {
    const o = new ResizeObserver(() => map.invalidateSize());
    o.observe(map.getContainer());
    return () => o.disconnect();
  }, [map]);
  return null;
}
export default function TripMap({
  day,
  overview,
  focus,
  onSelect,
}: {
  day: Day;
  overview: boolean;
  focus: Place | null;
  onSelect: (p: Place | null) => void;
}) {
  const [reset, setReset] = useState(0),
    [terrain, setTerrain] = useState(false),
    [tileError, setTileError] = useState(false);
  const visible = overview ? days : [day];

  return (
    <section className="nz-map-wrap" aria-label="每日行程地图">
      <MapContainer center={[-44.4, 170.2]} zoom={7} zoomControl={false} className="nz-map">
        <TileLayer
          key={String(terrain)}
          url={
            terrain
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
              : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
          attribution={
            terrain ? 'Tiles &copy; Esri' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
          eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }}
        />
        <Viewport day={day} overview={overview} focus={focus} reset={reset} />
        {visible.map((d) => (
          <Polyline
            key={d.id}
            positions={roads[d.id]?.positions || d.stops.map((s) => s.place.position)}
            pathOptions={{
              color: colors[d.id - 3],
              weight: overview ? 3 : 4,
              opacity: 0.85,
              dashArray: roads[d.id] ? undefined : d.mode === 'flight' ? '3 10' : '8 7',
            }}
          />
        ))}
        <PlaceMarkers day={day} overview={overview} focus={focus} onSelect={onSelect} />

        <MapButtons
          reset={() => {
            setReset((x) => x + 1);
            onSelect(null);
          }}
        />
      </MapContainer>
      <div className="nz-map-top">
        <span>
          <span className="nz-live-dot" />
          {overview ? '南岛全程总览' : `DAY ${day.id} · ${day.subtitle}`}
        </span>
        <button
          onClick={() => {
            setTerrain((t) => !t);
            setTileError(false);
          }}
        >
          <Layers size={15} />
          {terrain ? '地形地图' : '街道地图'}
        </button>
      </div>
      <div className="nz-map-bottom">
        <MapIcon size={15} />
        <span>
          {day.mode === 'flight' && !overview ? '虚线为飞行方向示意' : '实线为主要道路参考 · 虚线为活动顺序示意'} ·
          地点坐标仅供行程浏览
        </span>
      </div>
      {tileError && <div className="nz-map-error">底图连接暂不可用 · 可切换地图或使用地点导航</div>}
    </section>
  );
}
function MapButtons({ reset }: { reset: () => void }) {
  const map = useMap();
  return (
    <div className="nz-map-controls">
      <button aria-label="放大地图" onClick={() => map.zoomIn()}>
        +
      </button>
      <button aria-label="缩小地图" onClick={() => map.zoomOut()}>
        −
      </button>
      <button aria-label="显示完整路线" onClick={reset}>
        <LocateFixed size={19} />
      </button>
    </div>
  );
}

function PlaceMarkers({
  day,
  overview,
  focus,
  onSelect,
}: {
  day: Day;
  overview: boolean;
  focus: Place | null;
  onSelect: (p: Place | null) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const stops = overview
    ? Object.values(Object.fromEntries(days.flatMap((d) => d.stops).map((s) => [s.place.id, s])))
    : day.stops.filter((s, i, a) => a.findIndex((x) => x.place.id === s.place.id) === i);
  const groups: { place: Place; items: { place: Place; number: number }[] }[] = [];
  stops.forEach((s, i) => {
    const point = map.project(s.place.position, zoom);
    const group = groups.find((g) => map.project(g.place.position, zoom).distanceTo(point) < 32);
    if (group) group.items.push({ place: s.place, number: i + 1 });
    else groups.push({ place: s.place, items: [{ place: s.place, number: i + 1 }] });
  });
  return (
    <>
      {groups.map((g) => {
        const selected = g.items.some((s) => s.place.id === focus?.id);
        const title = g.items.map((s) => s.place.name).join(' / ');
        const label = overview
          ? g.items.length > 1
            ? String(g.items.length)
            : '•'
          : g.items.length > 1
            ? `${g.items[0].number}+`
            : String(g.items[0].number);
        return (
          <Marker
            key={g.place.id}
            position={g.place.position}
            title={title}
            eventHandlers={{ click: () => onSelect(g.place) }}
            icon={L.divIcon({
              className: 'nz-marker-container',
              html: `<span class="nz-marker ${selected ? 'active' : ''}">${label}</span>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Tooltip
              direction="top"
              offset={[0, -17]}
              permanent={selected || (!overview && (g === groups[0] || g === groups[groups.length - 1]))}
            >
              {selected
                ? focus?.name
                : g.items.length > 1
                  ? `${g.place.name} · ${g.items.length} 个地点`
                  : g.place.name}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
