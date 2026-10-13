// ─────────────────────────────────────────────────────────────────────────────
// Map configuration — OpenStreetMap / Leaflet (no API key, no Google Cloud)
// ─────────────────────────────────────────────────────────────────────────────

export const OSM_TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Nominatim (OSM) geocoding endpoint — free, no API key required. */
export const NOMINATIM_URL =
  process.env.NEXT_PUBLIC_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org';

/** Haversine distance in km — no API call needed */
export const haversineKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Default map center — Damascus, Syria
export const DEFAULT_CENTER = { lat: 33.5138, lng: 36.2765 };
export const DEFAULT_ZOOM = 12;

// ─── Polyline encoding (Google Polyline Algorithm Format) ────────────────────
export const encodePolyline = (points: Array<[number, number]>, precision = 5): string => {
  const factor = Math.pow(10, precision);
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of points) {
    const lat5 = Math.round(lat * factor);
    const lng5 = Math.round(lng * factor);
    output += encodeSignedNumber(lat5 - prevLat);
    output += encodeSignedNumber(lng5 - prevLng);
    prevLat = lat5;
    prevLng = lng5;
  }
  return output;
};

export const decodePolyline = (encoded: string, precision = 5): Array<[number, number]> => {
  const factor = Math.pow(10, precision);
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    lat += decodeSignedNumber(encoded, index);
    index = skipChunk(encoded, index);
    lng += decodeSignedNumber(encoded, index);
    index = skipChunk(encoded, index);
    points.push([lat / factor, lng / factor]);
  }
  return points;
};

const encodeSignedNumber = (num: number): string => {
  let sgnNum = num << 1;
  if (num < 0) sgnNum = ~sgnNum;
  let value = '';
  while (sgnNum >= 0x20) {
    value += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  value += String.fromCharCode(sgnNum + 63);
  return value;
};

const decodeSignedNumber = (encoded: string, startIndex: number): number => {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let b: number;
  do {
    b = encoded.charCodeAt(index++) - 63;
    result |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);
  return result & 1 ? ~(result >> 1) : result >> 1;
};

const skipChunk = (encoded: string, startIndex: number): number => {
  let index = startIndex;
  while (encoded.charCodeAt(index++) >= 0x40);
  return index;
};

export const pathDistanceKm = (points: Array<[number, number]>): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return Math.round(total * 10) / 10;
};

export type GeocodeResult = { lat: number; lng: number; name: string };

/**
 * Forward geocoding — restricted to Syria (countrycodes=sy).
 * Returns up to `limit` suggestions matching the query.
 */
export const searchPlaces = async (query: string, limit = 6): Promise<GeocodeResult[]> => {
  if (!query.trim()) return [];

  const url =
    `${NOMINATIM_URL}/search?format=json` +
    `&q=${encodeURIComponent(query)}` +
    `&countrycodes=sy` +
    `&limit=${limit}` +
    `&accept-language=ar` +
    `&addressdetails=1`;

  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'ar' } });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      lat: string; lon: string; display_name: string;
      address?: { city?: string; town?: string; village?: string; state?: string };
    }>;
    return data.map((d) => {
      // Build a shorter, friendlier name: "district, city" instead of the full display_name
      const addr = d.address ?? {};
      const locality = addr.city ?? addr.town ?? addr.village ?? '';
      const state = addr.state ?? '';
      const shortName = locality && state
        ? `${locality}، ${state}`
        : d.display_name.split(',').slice(0, 3).join(',').trim();
      return { lat: parseFloat(d.lat), lng: parseFloat(d.lon), name: shortName || d.display_name };
    });
  } catch {
    return [];
  }
};

/** Reverse geocoding — get a place name from coordinates. */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const url = `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'ar' } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};
