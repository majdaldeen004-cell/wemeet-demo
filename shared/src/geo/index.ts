// ─────────────────────────────────────────────────────────────────────────────
// Shared geo utilities — used by web (Leaflet) and mobile (react-native-maps
// with OpenStreetMap tiles). No Google Maps / Google Cloud dependency.
// ─────────────────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points. */
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

/** Total distance of a path (array of [lat, lng]) in km. */
export const pathDistanceKm = (points: Array<[number, number]>): number => {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const [lat1, lng1] = points[i - 1];
    const [lat2, lng2] = points[i];
    dist += haversineKm(lat1, lng1, lat2, lng2);
  }
  return dist;
};

// Default map center — Damascus, Syria
export const DEFAULT_CENTER = { lat: 33.5138, lng: 36.2765 };
export const DEFAULT_ZOOM = 12;

// ─── Polyline encoding (Google Polyline Algorithm Format) ────────────────────
// Open, widely-implemented encoding algorithm (used by OSRM, Mapbox, Valhalla,
// etc.) — NOT a Google API call. Used purely as a compact string format for
// storing routes.

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
  let byte: number;

  do {
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return result & 1 ? ~(result >> 1) : result >> 1;
};

const skipChunk = (encoded: string, startIndex: number): number => {
  let index = startIndex;
  let byte: number;
  do {
    byte = encoded.charCodeAt(index++) - 63;
  } while (byte >= 0x20);
  return index;
};

// ─── OpenStreetMap tile / geocoding config ───────────────────────────────────

/** Default public OSM raster tile template. Self-host for production traffic. */
export const DEFAULT_OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

/** Default public Nominatim geocoding endpoint. Self-host for production traffic. */
export const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

/** Forward geocoding — search for a place by name/address via Nominatim. */
export const searchPlacesOsm = async (
  query: string,
  opts: { nominatimUrl?: string; limit?: number; language?: string } = {},
): Promise<GeocodeResult[]> => {
  if (!query.trim()) return [];
  const { nominatimUrl = DEFAULT_NOMINATIM_URL, limit = 5, language = 'ar' } = opts;

  const url = `${nominatimUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&accept-language=${language}`;
  const res = await fetch(url, { headers: { 'Accept-Language': language } });
  if (!res.ok) return [];

  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data.map((d) => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), name: d.display_name }));
};

/** Reverse geocoding — get a place name from coordinates via Nominatim. */
export const reverseGeocodeOsm = async (
  lat: number,
  lng: number,
  opts: { nominatimUrl?: string; language?: string } = {},
): Promise<string> => {
  const { nominatimUrl = DEFAULT_NOMINATIM_URL, language = 'ar' } = opts;
  const url = `${nominatimUrl}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language}`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': language } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};
