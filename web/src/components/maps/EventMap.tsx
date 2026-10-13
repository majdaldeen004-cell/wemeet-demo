'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Users, MapPin, Undo2, X } from 'lucide-react';
import {
  OSM_TILE_URL, OSM_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM,
  encodePolyline, decodePolyline, pathDistanceKm, searchPlaces, reverseGeocode,
  type GeocodeResult,
} from '@/lib/maps/loader';
import type { Event } from '@/types';

const CAT_COLOR: Record<string, string> = {
  CYCLING: '#22c55e', OUTDOOR: '#16a34a', STUDY:  '#3b82f6',
  GAMING:  '#8b5cf6', PETS:    '#f59e0b', SOCIAL: '#ec4899',
  SPORTS:  '#ef4444', OTHER:   '#94a3b8',
};

// ─── Marker icon factory ──────────────────────────────────────────────────────

const pinIcon = (color: string): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25));">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 9.941 18 24 18 24S36 27.941 36 18C36 8.059 27.941 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
    </svg>`,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
  });

const dotIcon = (color: string): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// ─── Events Map (discovery mode) ─────────────────────────────────────────────

interface EventsMapProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  center?: { lat: number; lng: number };
  height?: string;
}

/** Recenters the map imperatively when `center` changes after first mount. */
const RecenterOnChange = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
};

export const EventsMap = ({
  events, onEventClick, center = DEFAULT_CENTER, height = '400px',
}: EventsMapProps) => {
  return (
    <div style={{ width: '100%', height, borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <RecenterOnChange center={center} />

        {events
          .filter((e) => e.locationLat && e.locationLng)
          .map((event) => (
            <Marker
              key={event.id}
              position={[Number(event.locationLat), Number(event.locationLng)]}
              icon={pinIcon(CAT_COLOR[event.category] ?? '#94a3b8')}
              eventHandlers={{ click: () => onEventClick?.(event) }}
            >
              <Popup>
                <div style={{ fontFamily: 'inherit', minWidth: 160 }}>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>{event.title}</strong>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>
                    {new Date(event.scheduledAt).toLocaleDateString('ar-SY', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {event.locationName && (
                    <p style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {event.locationName}
                    </p>
                  )}
                  <p style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {event.memberCount} members
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

// ─── Location Picker (for create-event) ──────────────────────────────────────

interface LocationPickerProps {
  value?: { lat: number; lng: number; name?: string };
  onChange: (loc: { lat: number; lng: number; name: string }) => void;
  height?: string;
}

const ClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

export const LocationPicker = ({ value, onChange, height = '280px' }: LocationPickerProps) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  );
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarker({ lat, lng });
    setResults([]);
    const name = await reverseGeocode(lat, lng);
    setQuery(name);
    onChange({ lat, lng, name });
  }, [onChange]);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const found = await searchPlaces(val);
      setResults(found);
      setSearching(false);
    }, 400);
  };

  const selectResult = (r: GeocodeResult) => {
    setMarker({ lat: r.lat, lng: r.lng });
    setQuery(r.name);
    setResults([]);
    onChange({ lat: r.lat, lng: r.lng, name: r.name });
  };

  const center = marker ?? DEFAULT_CENTER;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="ابحث عن موقع..."
          style={{
            width: '100%', height: 44, border: '1.5px solid #d6c9b0',
            borderRadius: 12, padding: '0 16px', fontSize: 14,
            backgroundColor: '#ede5d5', color: '#0f172a',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 48, left: 0, right: 0, zIndex: 1000,
            background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden', border: '1px solid #e2e8f0',
          }}>
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  textAlign: 'right', padding: '10px 12px', fontSize: 13,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                  color: '#0f172a',
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0, color: '#94a3b8' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              </button>
            ))}
          </div>
        )}
        {searching && (
          <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 12, color: '#94a3b8' }}>
            جارِ البحث...
          </span>
        )}
      </div>

      <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={marker ? 15 : DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
          <ClickHandler onClick={handleMapClick} />
          {marker && (
            <Marker position={[marker.lat, marker.lng]} icon={dotIcon('#22c55e')} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

// ─── Route Map (cycling / outdoor events with polyline) ───────────────────────

interface RouteMapProps {
  polyline: string;
  center?: { lat: number; lng: number };
  height?: string;
}

const FitToRoute = ({ points }: { points: Array<[number, number]> }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
};

export const RouteMap = ({ polyline, center = DEFAULT_CENTER, height = '300px' }: RouteMapProps) => {
  const decoded = polyline ? decodePolyline(polyline) : [];

  if (!decoded.length) {
    return <div style={{ width: '100%', height, borderRadius: 16, background: '#ede5d5' }} />;
  }

  return (
    <div style={{ width: '100%', height, borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <FitToRoute points={decoded} />
        <Polyline positions={decoded} pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.9 }} />
        <Marker position={decoded[0]} icon={dotIcon('#22c55e')} />
        <Marker position={decoded[decoded.length - 1]} icon={dotIcon('#3b82f6')} />
      </MapContainer>
    </div>
  );
};

// ─── Route Drawer (for create-event cycling routes) ──────────────────────────

interface RouteDrawerProps {
  onChange: (polyline: string, distanceKm: number) => void;
  height?: string;
}

const DrawClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

export const RouteDrawer = ({ onChange, height = '320px' }: RouteDrawerProps) => {
  const [points, setPoints] = useState<Array<[number, number]>>([]);

  const addPoint = useCallback((lat: number, lng: number) => {
    setPoints((prev) => {
      const next: Array<[number, number]> = [...prev, [lat, lng]];
      if (next.length >= 2) {
        onChange(encodePolyline(next), parseFloat(pathDistanceKm(next).toFixed(2)));
      } else {
        onChange('', 0);
      }
      return next;
    });
  }, [onChange]);

  const undo = () => {
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      if (next.length >= 2) {
        onChange(encodePolyline(next), parseFloat(pathDistanceKm(next).toFixed(2)));
      } else {
        onChange('', 0);
      }
      return next;
    });
  };

  const clear = () => {
    setPoints([]);
    onChange('', 0);
  };

  const distKm = points.length >= 2 ? parseFloat(pathDistanceKm(points).toFixed(2)) : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>
          {points.length === 0
            ? 'اضغط على الخريطة لرسم المسار'
            : `${points.length} نقطة · ${distKm} كم`}
        </span>
        {points.length > 0 && (
          <>
            <button type="button" onClick={undo} style={btnStyle}>
              <Undo2 size={14} /> تراجع
            </button>
            <button type="button" onClick={clear} style={{ ...btnStyle, color: '#ef4444' }}>
              <X size={14} /> مسح
            </button>
          </>
        )}
      </div>
      <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer
          center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
          <DrawClickHandler onClick={addPoint} />
          {points.length >= 2 && (
            <Polyline positions={points} pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.9 }} />
          )}
          {points.map((p, i) => (
            <Marker
              key={i}
              position={p}
              icon={dotIcon(i === 0 ? '#22c55e' : i === points.length - 1 ? '#3b82f6' : '#ffffff')}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 12, fontWeight: 600, padding: '4px 10px',
  borderRadius: 8, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', cursor: 'pointer', color: '#475569',
};
