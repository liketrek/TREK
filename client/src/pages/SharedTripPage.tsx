import L from 'leaflet';
import {
  Bus,
  Car,
  Clock,
  FileText,
  Hotel,
  Luggage,
  Map,
  MapPin,
  MessageCircle,
  Plane,
  Ship,
  Ticket,
  Train,
  Wallet,
} from 'lucide-react';
import { createElement, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { getCategoryIcon } from '../components/shared/categoryIcons';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../constants/mapDefaults';
import { SUPPORTED_LANGUAGES, useTranslation } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { avatarSrc } from '../utils/avatarSrc';
import { getMergedItems, getTransportForDay } from '../utils/dayMerge';
import { isDayInAccommodationRange } from '../utils/dayOrder';
import { getFlightLegs, getTrainLegs } from '../utils/flightLegs';
import { splitReservationDateTime } from '../utils/formatters';
import { computeMapViewport, TILE_SIZE_RASTER } from '../utils/mapViewport';
import { useSharedTrip } from './sharedTrip/useSharedTrip';

const TRANSPORT_ICONS = { flight: Plane, train: Train, bus: Bus, car: Car, cruise: Ship };

function createMarkerIcon(place: any) {
  const cat = place.category;
  const color = cat?.color || '#6366f1';
  const CatIcon = getCategoryIcon(cat?.icon);
  const iconSvg = renderToStaticMarkup(createElement(CatIcon, { size: 14, strokeWidth: 2, color: 'white' }));
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">${iconSvg}</div>`,
  });
}

function FitBoundsToPlaces({ places, framedOnMount }: { places: any[]; framedOnMount: boolean }) {
  const map = useMap();
  const fitRan = useRef(false);
  useEffect(() => {
    if (places.length === 0) return;
    // The map already opened framed on these places; fitting again would only re-do it.
    // Picking a day afterwards still refits to that day.
    if (!fitRan.current && framedOnMount) {
      fitRan.current = true;
      return;
    }
    fitRan.current = true;
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [places, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function SharedTripPage() {
  const { t, locale } = useTranslation();
  // Page = wiring container: share fetch + view state live in the hook.
  const {
    data,
    error,
    base,
    convert,
    selectedDay,
    setSelectedDay,
    activeTab,
    setActiveTab,
    showLangPicker,
    setShowLangPicker,
  } = useSharedTrip();

  if (error)
    return (
      <div
        className="bg-[#f3f4f6]"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 'calc(48px * var(--fs-scale-title, 1))', marginBottom: 16 }}>🔒</div>
          <h1 className="text-[#111827]" style={{ fontSize: 'calc(20px * var(--fs-scale-title, 1))', fontWeight: 700 }}>
            {t('shared.expired')}
          </h1>
          <p className="text-[#6b7280]" style={{ marginTop: 8 }}>
            {t('shared.expiredHint')}
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div
        className="bg-[#f3f4f6]"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #e5e7eb',
            borderTopColor: '#111827',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );

  const {
    trip,
    days,
    assignments,
    dayNotes,
    places,
    reservations,
    accommodations,
    packing,
    budget,
    categories,
    permissions,
    collab,
  } = data;
  const sortedDays = [...(days || [])].sort((a: any, b: any) => a.day_number - b.day_number);

  // Map places
  const mapPlaces = selectedDay
    ? (assignments[String(selectedDay)] || []).map((a: any) => a.place).filter((p: any) => p?.lat && p?.lng)
    : (places || []).filter((p: any) => p?.lat && p?.lng);

  // Open framed on the trip's places instead of on Paris. MapContainer only reads center/zoom
  // at mount, so recomputing this per render is free — and the fit below takes over from there.
  const framed = computeMapViewport(mapPlaces, {
    tileSize: TILE_SIZE_RASTER,
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
  });
  const initialView = framed ?? { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM };

  return (
    <div className="bg-surface-secondary" style={{ minHeight: '100vh', fontFamily: 'var(--font-system)' }}>
      {/* Header */}
      <div
        className="text-white"
        style={{
          background: 'linear-gradient(135deg, #000 0%, #0f172a 50%, #1e293b 100%)',
          padding: '32px 20px 28px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Cover image background */}
        {trip.cover_image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${trip.cover_image.startsWith('http') ? trip.cover_image : trip.cover_image.startsWith('/') ? trip.cover_image : '/uploads/' + trip.cover_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15,
            }}
          />
        )}
        {/* Background decoration */}
        <div
          className="bg-[rgba(255,255,255,0.03)]"
          style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%' }}
        />
        <div
          className="bg-[rgba(255,255,255,0.02)]"
          style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%' }}
        />

        {/* Logo */}
        <div
          className="bg-[rgba(255,255,255,0.08)]"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
            marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <img src="/icons/icon-white.svg" alt="TREK" width="26" height="26" />
        </div>

        <div
          style={{
            fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.35,
            marginBottom: 12,
          }}
        >
          Travel Resource & Exploration Kit
        </div>

        <h1
          style={{
            margin: '0 0 4px',
            fontSize: 'calc(26px * var(--fs-scale-title, 1))',
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          {trip.title}
        </h1>

        {trip.description && (
          <div
            style={{
              fontSize: 'calc(13px * var(--fs-scale-body, 1))',
              opacity: 0.5,
              maxWidth: 400,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            {trip.description}
          </div>
        )}

        {(trip.start_date || trip.end_date) && (
          <div
            className="bg-[rgba(255,255,255,0.08)]"
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: 0.8 }}>
              {[trip.start_date, trip.end_date]
                .filter(Boolean)
                .map((d: string) =>
                  new Date(d + 'T00:00:00Z').toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })
                )
                .join(' — ')}
            </span>
            {days?.length > 0 && (
              <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', opacity: 0.4 }}>·</span>
            )}
            {days?.length > 0 && (
              <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', opacity: 0.5 }}>
                {days.length} {t('shared.days')}
              </span>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
            fontWeight: 500,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            opacity: 0.25,
          }}
        >
          {t('shared.readOnly')}
        </div>

        {/* Language picker - top right */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <button
            onClick={() => setShowLangPicker((v) => !v)}
            className="bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]"
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {SUPPORTED_LANGUAGES.find((l) => l.value === (locale?.split('-')[0] || 'en'))?.label || 'Language'}
          </button>
          {showLangPicker && (
            <div
              className="bg-white"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                padding: 4,
                zIndex: 50,
                minWidth: 150,
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => {
                    // Set language locally without API call (shared page has no auth)
                    useSettingsStore.setState((s) => ({ settings: { ...s.settings, language: lang.value } }));
                    setShowLangPicker(false);
                  }}
                  className="text-[#374151]"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 12px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                    borderRadius: 6,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', padding: '2px 0' }}>
          {[
            ...(permissions?.share_map !== false ? [{ id: 'plan', label: t('shared.tabPlan'), Icon: Map }] : []),
            ...(permissions?.share_bookings ? [{ id: 'bookings', label: t('shared.tabBookings'), Icon: Ticket }] : []),
            ...(permissions?.share_packing ? [{ id: 'packing', label: t('shared.tabPacking'), Icon: Luggage }] : []),
            ...(permissions?.share_budget ? [{ id: 'budget', label: t('shared.tabBudget'), Icon: Wallet }] : []),
            ...(permissions?.share_collab ? [{ id: 'collab', label: t('shared.tabChat'), Icon: MessageCircle }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-[#111827] text-white' : 'bg-surface-card text-[#6b7280]'}
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border: '1.5px solid',
                cursor: 'pointer',
                fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: activeTab === tab.id ? '#111827' : 'var(--border-faint, #e5e7eb)',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <tab.Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Map */}
        {activeTab === 'plan' && (
          <>
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                height: 300,
                marginBottom: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <MapContainer
                center={initialView.center}
                zoom={initialView.zoom}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <FitBoundsToPlaces places={mapPlaces} framedOnMount={framed !== null} />
                {mapPlaces.map((p: any) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={createMarkerIcon(p)}>
                    <Tooltip>{p.name}</Tooltip>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Day Plan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedDays.map((day: any, di: number) => {
                const da = assignments[String(day.id)] || [];
                const notes = dayNotes[String(day.id)] || [];
                const dayAssignmentIds: number[] = da.map((a: any) => a.id);
                const dayTransport = getTransportForDay({
                  reservations: reservations || [],
                  dayId: day.id,
                  dayAssignmentIds,
                  days: sortedDays,
                });
                const dayAccs = (accommodations || []).filter((a: any) =>
                  isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, sortedDays)
                );

                const merged = getMergedItems({
                  dayAssignments: da,
                  dayNotes: notes,
                  dayTransports: dayTransport,
                  dayId: day.id,
                });

                return (
                  <div
                    key={day.id}
                    className="border border-edge-faint bg-surface-card"
                    style={{ borderRadius: 14, overflow: 'hidden' }}
                  >
                    <div
                      onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        className={selectedDay === day.id ? 'bg-[#111827] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {di + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          className="text-[#111827]"
                          style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600 }}
                        >
                          {day.title || t('dayplan.dayN', { n: day.day_number })}
                        </div>
                        {day.date && (
                          <div
                            className="text-[#9ca3af]"
                            style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 1 }}
                          >
                            {new Date(day.date + 'T00:00:00Z').toLocaleDateString(locale, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              timeZone: 'UTC',
                            })}
                          </div>
                        )}
                      </div>
                      {dayAccs.map((acc: any) => (
                        <span
                          key={acc.id}
                          className="bg-[#f3f4f6] text-[#6b7280]"
                          style={{
                            fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
                            padding: '2px 6px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Hotel size={8} /> {acc.place_name}
                        </span>
                      ))}
                      <span className="text-[#9ca3af]" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>
                        {da.length} {t('shared.places')}
                      </span>
                    </div>

                    {selectedDay === day.id && merged.length > 0 && (
                      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {merged.map((item: any) => {
                          if (item.type === 'transport') {
                            const r = item.data;
                            const TIcon = TRANSPORT_ICONS[r.type] || Ticket;
                            const meta =
                              typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata || {};
                            const time = splitReservationDateTime(r.reservation_time).time ?? '';
                            const endTime = splitReservationDateTime(r.reservation_end_time).time ?? '';
                            let sub = '';
                            if (r.type === 'flight') {
                              if (r.__leg) {
                                // One leg of a multi-leg flight — show this segment's own route/flight number.
                                sub = [
                                  r.__leg.airline,
                                  r.__leg.flight_number,
                                  r.__leg.from || r.__leg.to
                                    ? [r.__leg.from, r.__leg.to].filter(Boolean).join(' → ')
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' · ');
                              } else {
                                sub = [
                                  meta.airline,
                                  meta.flight_number,
                                  meta.departure_airport && meta.arrival_airport
                                    ? `${meta.departure_airport} → ${meta.arrival_airport}`
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' · ');
                              }
                            } else if (r.type === 'train') {
                              if (r.__leg) {
                                // One leg of a multi-leg train — show this segment's own train/route.
                                sub = [
                                  r.__leg.train_number,
                                  r.__leg.platform ? `Gl. ${r.__leg.platform}` : '',
                                  r.__leg.from || r.__leg.to
                                    ? [r.__leg.from, r.__leg.to].filter(Boolean).join(' → ')
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' · ');
                              } else {
                                sub = [meta.train_number, meta.platform ? `Gl. ${meta.platform}` : '']
                                  .filter(Boolean)
                                  .join(' · ');
                              }
                            }
                            return (
                              <div
                                key={r.__leg ? `t-${r.id}-leg${r.__leg.index}` : `t-${r.id}`}
                                className="bg-[rgba(59,130,246,0.06)]"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '6px 8px',
                                  borderRadius: 6,
                                  border: '1px solid rgba(59,130,246,0.15)',
                                }}
                              >
                                <div
                                  className="bg-[rgba(59,130,246,0.12)]"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <TIcon size={12} color="#3b82f6" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    className="text-[#111827]"
                                    style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}
                                  >
                                    {r.title}
                                    {time ? ` · ${time}${endTime ? `–${endTime}` : ''}` : ''}
                                  </div>
                                  {sub && (
                                    <div
                                      className="text-[#6b7280]"
                                      style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}
                                    >
                                      {sub}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          if (item.type === 'note') {
                            return (
                              <div
                                key={`n-${item.data.id}`}
                                className="bg-[#f9fafb]"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #f3f4f6',
                                }}
                              >
                                <FileText size={12} color="#9ca3af" />
                                <div>
                                  <div
                                    className="text-[#374151]"
                                    style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}
                                  >
                                    {item.data.text}
                                  </div>
                                  {item.data.time && (
                                    <div
                                      className="text-[#9ca3af]"
                                      style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}
                                    >
                                      {item.data.time}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          const place = item.data.place;
                          if (!place) return null;
                          const cat = categories?.find((c: any) => c.id === place.category_id);
                          return (
                            <div
                              key={`p-${item.data.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 8px',
                                borderRadius: 6,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: cat?.color || '#6366f1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {place.image_url ? (
                                  <img
                                    src={place.image_url}
                                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <MapPin size={13} color="white" />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  className="text-[#111827]"
                                  style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500 }}
                                >
                                  {place.name}
                                </div>
                                {(place.address || place.description) && (
                                  <div
                                    className="text-[#9ca3af]"
                                    style={{
                                      fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {place.address || place.description}
                                  </div>
                                )}
                              </div>
                              {place.place_time && (
                                <span
                                  className="text-[#6b7280]"
                                  style={{
                                    fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  <Clock size={9} />
                                  {place.place_time}
                                  {place.end_time ? ` – ${place.end_time}` : ''}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (reservations || []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(reservations || []).map((r: any) => {
              const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata || {};
              const TIcon = TRANSPORT_ICONS[r.type] || Ticket;
              const { date: rDate, time: rTime } = splitReservationDateTime(r.reservation_time);
              const time = rTime ?? '';
              const date = rDate
                ? new Date(rDate + 'T00:00:00Z').toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  })
                : '';
              return (
                <div
                  key={r.id}
                  className="border border-edge-faint bg-surface-card"
                  style={{ borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div
                    className="bg-[#f3f4f6]"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TIcon size={15} color="#6b7280" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="text-[#111827]"
                      style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}
                    >
                      {r.title}
                    </div>
                    <div
                      className="text-[#9ca3af]"
                      style={{
                        fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginTop: 2,
                      }}
                    >
                      {date && <span>{date}</span>}
                      {time && <span>{time}</span>}
                      {r.location && <span>{r.location}</span>}
                      {r.type === 'flight'
                        ? getFlightLegs(r).map((leg, i) => (
                            <span key={i}>
                              {[
                                leg.airline,
                                leg.flight_number,
                                leg.from || leg.to ? [leg.from, leg.to].filter(Boolean).join(' → ') : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </span>
                          ))
                        : r.type === 'train'
                          ? getTrainLegs(r).map((leg, i) => (
                              <span key={i}>
                                {[
                                  leg.train_number,
                                  leg.platform ? `${t('reservations.meta.platform')} ${leg.platform}` : '',
                                  leg.from || leg.to ? [leg.from, leg.to].filter(Boolean).join(' → ') : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              </span>
                            ))
                          : meta.airline && (
                              <span>
                                {meta.airline} {meta.flight_number || ''}
                              </span>
                            )}
                    </div>
                  </div>
                  <span
                    className={
                      r.status === 'confirmed'
                        ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]'
                        : 'bg-[rgba(217,119,6,0.1)] text-[#d97706]'
                    }
                    style={{
                      fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    {r.status === 'confirmed' ? t('shared.confirmed') : t('shared.pending')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Packing */}
        {activeTab === 'packing' && (packing || []).length > 0 && (
          <div className="border border-edge-faint bg-surface-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
            {Object.entries(
              (packing || []).reduce((g: any, i: any) => {
                const c = i.category || t('shared.other');
                (g[c] = g[c] || []).push(i);
                return g;
              }, {})
            ).map(([cat, items]: [string, any]) => (
              <div key={cat}>
                <div
                  className="bg-[#f9fafb] text-[#6b7280]"
                  style={{
                    padding: '8px 16px',
                    fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  {cat}
                </div>
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '6px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderBottom: '1px solid #f9fafb',
                    }}
                  >
                    <span
                      className={item.checked ? 'text-[#9ca3af]' : 'text-[#111827]'}
                      style={{
                        fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Budget */}
        {activeTab === 'budget' &&
          (budget || []).length > 0 &&
          (() => {
            // Pre-rework rows store currency = NULL ("the trip's own currency"); convert
            // each expense into the owner's display base via live FX, mirroring CostsPanel.
            const curOf = (i: any) => i.currency || trip.currency || base;
            const grouped = (budget || []).reduce((g: any, i: any) => {
              const c = i.category || t('shared.other');
              (g[c] = g[c] || []).push(i);
              return g;
            }, {});
            const sumIn = (items: any[]) =>
              items.reduce((s: number, i: any) => s + convert(parseFloat(i.total_price) || 0, curOf(i)), 0);
            const total = sumIn(budget || []);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Total card */}
                <div
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #000 0%, #1a1a2e 100%)',
                    borderRadius: 14,
                    padding: '20px 24px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                      fontWeight: 500,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      opacity: 0.5,
                    }}
                  >
                    {t('shared.totalBudget')}
                  </div>
                  <div style={{ fontSize: 'calc(28px * var(--fs-scale-title, 1))', fontWeight: 700, marginTop: 4 }}>
                    {total.toLocaleString(locale, { minimumFractionDigits: 2 })} {base}
                  </div>
                </div>
                {/* By category */}
                {Object.entries(grouped).map(([cat, items]: [string, any]) => (
                  <div
                    key={cat}
                    className="border border-edge-faint bg-surface-card"
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                  >
                    <div
                      className="bg-[#f9fafb]"
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <span
                        className="text-[#374151]"
                        style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700 }}
                      >
                        {cat}
                      </span>
                      <span
                        className="text-[#6b7280]"
                        style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}
                      >
                        {sumIn(items).toLocaleString(locale, { minimumFractionDigits: 2 })} {base}
                      </span>
                    </div>
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #fafafa',
                        }}
                      >
                        <span className="text-[#111827]" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>
                          {item.name}
                        </span>
                        <span
                          className="text-[#111827]"
                          style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}
                        >
                          {item.total_price
                            ? `${convert(parseFloat(item.total_price) || 0, curOf(item)).toLocaleString(locale, { minimumFractionDigits: 2 })} ${base}`
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

        {/* Collab Chat */}
        {activeTab === 'collab' && (collab || []).length > 0 && (
          <div className="border border-edge-faint bg-surface-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div
              className="bg-[#f9fafb]"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MessageCircle size={14} color="#6b7280" />
              <span
                className="text-[#374151]"
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700 }}
              >
                {t('shared.tabChat')} · {(collab || []).length} {t('shared.messages')}
              </span>
            </div>
            <div
              style={{
                maxHeight: 500,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {(collab || []).map((msg: any, i: number) => {
                const prevMsg = i > 0 ? collab[i - 1] : null;
                const showDate =
                  !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div
                        className="text-[#9ca3af]"
                        style={{
                          textAlign: 'center',
                          margin: '8px 0',
                          fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                          fontWeight: 600,
                        }}
                      >
                        {new Date(msg.created_at).toLocaleDateString(locale, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div
                        className="bg-[#e5e7eb] text-[#6b7280]"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                          fontWeight: 700,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {msg.avatar ? (
                          <img
                            src={avatarSrc(msg.avatar)!}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (msg.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span
                            className="text-[#111827]"
                            style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}
                          >
                            {msg.username}
                          </span>
                          <span
                            className="text-[#9ca3af]"
                            style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}
                          >
                            {new Date(msg.created_at).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className="text-[#374151]"
                          style={{
                            fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                            marginTop: 3,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
          <div
            className="border border-edge-faint bg-surface-card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <img src="/icons/icon.svg" alt="TREK" width="18" height="18" style={{ borderRadius: 4 }} />
            <span className="text-[#9ca3af]" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>
              {t('shared.sharedVia')} <strong className="text-[#6b7280]">TREK</strong>
            </span>
          </div>
          <div className="text-[#d1d5db]" style={{ marginTop: 8, fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>
            Made with <span className="text-[#ef4444]">&hearts;</span> by Maurice ·{' '}
            <a href="https://github.com/liketrek/TREK" className="text-[#9ca3af]" style={{ textDecoration: 'none' }}>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
