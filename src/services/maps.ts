/**
 * Camada de serviço de mapas/rotas.
 *
 * Provedor padrão: OpenStreetMap (gratuito, sem chave).
 *  - Tiles/mapa: OpenStreetMap via Leaflet
 *  - Busca/geocodificação: Nominatim (https://nominatim.openstreetmap.org)
 *  - Rotas, distâncias e durações: OSRM demo (https://router.project-osrm.org)
 *
 * Os provedores acima são gratuitos e não exigem chave, mas possuem política de
 * uso justo (máx. ~1 requisição por segundo no Nominatim, sem uso pesado no OSRM
 * demo). Por isso aplicamos debounce, fila serializada e cache local.
 *
 * A interface exportada é estável: para migrar para Google Maps/Mapbox basta
 * implementar outro provedor com as mesmas funções (searchPlaces, geocode*,
 * fetchRouteMatrix, fetchRouteGeometry) e trocar VITE_MAPS_PROVIDER.
 */
import type { PlaceCategory, TransportMode } from "@/types/trip";

export interface GeoResult {
  externalPlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  rating?: number;
  imageUrl?: string;
  isMock: boolean;
}

export interface RouteLeg {
  distanceKm: number;
  durationMinutes: number;
  isMock: boolean;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const mapsProvider =
  (import.meta.env["VITE_MAPS_PROVIDER"] as string | undefined) ?? "openstreetmap";

/** O provedor OSM funciona sem credenciais; Google/Mapbox exigiriam token. */
export const isMapsConfigured =
  mapsProvider === "openstreetmap" || Boolean(import.meta.env["VITE_MAPS_PUBLIC_TOKEN"]);

export const usesOpenStreetMap = mapsProvider === "openstreetmap";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rotas por <a href="http://project-osrm.org/">OSRM</a>';

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const OSRM_URL = "https://router.project-osrm.org";

/** Base simulada de lugares (fallback de demonstração). */
const MOCK_PLACES: Omit<GeoResult, "isMock">[] = [
  { externalPlaceId: "sp-masp", name: "MASP — Museu de Arte de São Paulo", address: "Av. Paulista, 1578 — Bela Vista, São Paulo", latitude: -23.5614, longitude: -46.6559, category: "museu", rating: 4.7 },
  { externalPlaceId: "sp-ibirapuera", name: "Parque Ibirapuera", address: "Av. Pedro Álvares Cabral — Vila Mariana, São Paulo", latitude: -23.5874, longitude: -46.6576, category: "parque", rating: 4.8 },
  { externalPlaceId: "sp-mercadao", name: "Mercado Municipal de São Paulo", address: "R. da Cantareira, 306 — Centro, São Paulo", latitude: -23.5417, longitude: -46.6294, category: "ponto_turistico", rating: 4.6 },
  { externalPlaceId: "sp-catavento", name: "Museu Catavento", address: "Pç. Cív. Ulisses Guimarães — Brás, São Paulo", latitude: -23.5473, longitude: -46.6262, category: "museu", rating: 4.7 },
  { externalPlaceId: "sp-farol", name: "Farol Santander", address: "R. João Brícola, 24 — Centro, São Paulo", latitude: -23.5464, longitude: -46.6342, category: "ponto_turistico", rating: 4.6 },
  { externalPlaceId: "sp-pinacoteca", name: "Pinacoteca de São Paulo", address: "Pç. da Luz, 2 — Luz, São Paulo", latitude: -23.5343, longitude: -46.6337, category: "museu", rating: 4.8 },
  { externalPlaceId: "sp-liberdade", name: "Bairro da Liberdade", address: "R. Galvão Bueno — Liberdade, São Paulo", latitude: -23.5587, longitude: -46.6350, category: "ponto_turistico", rating: 4.5 },
  { externalPlaceId: "sp-bolinha", name: "Restaurante Bolinha", address: "Av. Cidade Jardim, 53 — Jardim Europa, São Paulo", latitude: -23.5850, longitude: -46.6790, category: "restaurante", rating: 4.4 },
  { externalPlaceId: "sp-figueira", name: "Figueira Rubaiyat", address: "R. Haddock Lobo, 1738 — Jardins, São Paulo", latitude: -23.5637, longitude: -46.6683, category: "restaurante", rating: 4.6 },
  { externalPlaceId: "sp-paulista-hotel", name: "Hospedagem — Avenida Paulista", address: "Av. Paulista, 900 — Bela Vista, São Paulo", latitude: -23.5680, longitude: -46.6490, category: "hotel", rating: 4.3 },
  { externalPlaceId: "sp-cafe-floresta", name: "Café Floresta (Edifício Copan)", address: "Av. Ipiranga, 200 — República, São Paulo", latitude: -23.5464, longitude: -46.6430, category: "cafe", rating: 4.5 },
  { externalPlaceId: "sp-batman", name: "Beco do Batman", address: "R. Gonçalo Afonso — Vila Madalena, São Paulo", latitude: -23.5545, longitude: -46.6900, category: "ponto_turistico", rating: 4.5 },
  { externalPlaceId: "rj-cristo", name: "Cristo Redentor", address: "Parque Nacional da Tijuca — Rio de Janeiro", latitude: -22.9519, longitude: -43.2105, category: "ponto_turistico", rating: 4.8 },
  { externalPlaceId: "rj-pao", name: "Pão de Açúcar", address: "Av. Pasteur, 520 — Urca, Rio de Janeiro", latitude: -22.9486, longitude: -43.1566, category: "ponto_turistico", rating: 4.8 },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Gera coordenadas determinísticas próximas ao centro simulado, para endereços livres. */
function pseudoCoords(seed: string): LatLng {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return {
    latitude: -23.55 + ((hash % 200) - 100) / 4000,
    longitude: -46.64 + ((Math.floor(hash / 200) % 200) - 100) / 4000,
  };
}

/* -------------------------------------------------------------------------- */
/* Cache + fila (respeita a política de uso justo dos provedores públicos)      */
/* -------------------------------------------------------------------------- */

const memoryCache = new Map<string, unknown>();

function cacheGet<T>(key: string): T | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key) as T;
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(`routeasy:maps:${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as T;
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

function cacheSet(key: string, value: unknown) {
  memoryCache.set(key, value);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`routeasy:maps:${key}`, JSON.stringify(value));
  } catch {
    /* quota cheia: cache em memória já é suficiente */
  }
}

/** Fila serializada com intervalo mínimo entre chamadas ao mesmo provedor. */
function createQueue(minIntervalMs: number) {
  let chain: Promise<unknown> = Promise.resolve();
  let last = 0;
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = chain.then(async () => {
      const wait = Math.max(0, minIntervalMs - (Date.now() - last));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
      return task();
    });
    chain = run.catch(() => undefined);
    return run as Promise<T>;
  };
}

const nominatimQueue = createQueue(1100); // limite público: 1 req/s
const osrmQueue = createQueue(350);

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`Falha na requisição (${response.status})`);
  return (await response.json()) as T;
}

/* -------------------------------------------------------------------------- */
/* Busca e geocodificação (Nominatim)                                           */
/* -------------------------------------------------------------------------- */

interface NominatimItem {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  category?: string;
  type?: string;
  class?: string;
}

const CATEGORY_BY_OSM: Record<string, PlaceCategory> = {
  museum: "museu",
  artwork: "ponto_turistico",
  attraction: "ponto_turistico",
  viewpoint: "ponto_turistico",
  park: "parque",
  garden: "parque",
  restaurant: "restaurante",
  fast_food: "restaurante",
  cafe: "cafe",
  bar: "restaurante",
  pub: "restaurante",
  nightclub: "evento",
  hotel: "hotel",
  hostel: "hotel",
  guest_house: "hotel",
  mall: "compras",
  marketplace: "compras",
  supermarket: "compras",
  department_store: "compras",
  theatre: "ponto_turistico",
  zoo: "ponto_turistico",
};

function toCategory(item: NominatimItem): PlaceCategory {
  return CATEGORY_BY_OSM[item.type ?? ""] ?? CATEGORY_BY_OSM[item.class ?? ""] ?? "ponto_turistico";
}

function toGeoResult(item: NominatimItem): GeoResult {
  const parts = item.display_name.split(",").map((p) => p.trim());
  const name = item.name?.trim() || parts[0] || item.display_name;
  return {
    externalPlaceId: `osm:${item.osm_type ?? "n"}${item.osm_id ?? item.place_id}`,
    name,
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    category: toCategory(item),
    isMock: false,
  };
}

function searchMock(query: string): GeoResult[] {
  const term = normalize(query.trim());
  return MOCK_PLACES.filter(
    (p) => normalize(p.name).includes(term) || normalize(p.address).includes(term),
  ).map((p) => ({ ...p, isMock: true }));
}

/**
 * Busca endereços/lugares reais no Nominatim, com cache por termo.
 * `near` (cidade/destino) prioriza resultados na região informada.
 * Em caso de falha ou zero resultados, cai para a base de demonstração.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  options?: { near?: string | undefined },
): Promise<GeoResult[]> {
  const term = query.trim();
  if (term.length < 3) return [];
  const near = options?.near?.trim() ?? "";
  const biased = near && !normalize(term).includes(normalize(near).split(",")[0]!.trim())
    ? `${term}, ${near}`
    : term;
  const key = `search:${normalize(biased)}`;
  const cached = cacheGet<GeoResult[]>(key);
  if (cached) return cached;

  if (!usesOpenStreetMap) return searchMock(term);

  try {
    const params = new URLSearchParams({
      q: biased,
      format: "jsonv2",
      limit: "8",
      addressdetails: "1",
      "accept-language": "pt-BR",
    });
    const items = await nominatimQueue(() =>
      getJson<NominatimItem[]>(`${NOMINATIM_URL}/search?${params.toString()}`, signal),
    );
    const results = items.map(toGeoResult);
    if (results.length === 0 && biased !== term) return searchPlaces(term, signal);
    if (results.length === 0) return searchMock(term);
    cacheSet(key, results);
    return results;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return searchMock(term);
  }
}


/** Geocodificação síncrona (fallback offline/demonstração). */
export function geocodeAddress(address: string): LatLng {
  const key = `geo:${normalize(address)}`;
  const cached = cacheGet<LatLng>(key);
  if (cached) return cached;
  const found = MOCK_PLACES.find((p) => normalize(p.address).includes(normalize(address)));
  if (found) return { latitude: found.latitude, longitude: found.longitude };
  return pseudoCoords(address);
}

/** Geocodificação real via Nominatim, com cache; usa o fallback se falhar. */
export async function geocodeAddressAsync(address: string): Promise<LatLng> {
  const term = address.trim();
  if (!term) return geocodeAddress(term);
  const key = `geo:${normalize(term)}`;
  const cached = cacheGet<LatLng>(key);
  if (cached) return cached;
  if (!usesOpenStreetMap) return geocodeAddress(term);
  try {
    const params = new URLSearchParams({
      q: term,
      format: "jsonv2",
      limit: "1",
      "accept-language": "pt-BR",
    });
    const items = await nominatimQueue(() =>
      getJson<NominatimItem[]>(`${NOMINATIM_URL}/search?${params.toString()}`),
    );
    const first = items[0];
    if (!first) return geocodeAddress(term);
    const coords = { latitude: Number(first.lat), longitude: Number(first.lon) };
    cacheSet(key, coords);
    return coords;
  } catch {
    return geocodeAddress(term);
  }
}

/* -------------------------------------------------------------------------- */
/* Rotas, distâncias e durações (OSRM)                                          */
/* -------------------------------------------------------------------------- */

const SPEEDS_KMH: Record<TransportMode, number> = {
  carro: 26,
  transporte_publico: 17,
  bicicleta: 13,
  a_pe: 4.6,
};

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const coordKey = (c: LatLng) => `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;
const legKey = (a: LatLng, b: LatLng, mode: TransportMode) =>
  `leg:${mode}:${coordKey(a)}>${coordKey(b)}`;

/** Distâncias reais já conhecidas (preenchidas por `warmupRoutes`). */
const legCache = new Map<string, RouteLeg>();

/** Converte distância real de estrada em duração conforme o modo escolhido. */
function durationFor(distanceKm: number, mode: TransportMode, osrmDrivingMinutes?: number): number {
  if (mode === "carro" && osrmDrivingMinutes) return Math.max(3, Math.round(osrmDrivingMinutes) + 4);
  const overhead = mode === "transporte_publico" ? 8 : mode === "carro" ? 4 : 2;
  return Math.max(3, Math.round((distanceKm / SPEEDS_KMH[mode]) * 60) + overhead);
}

/**
 * Estimativa de trajeto usada pelo otimizador (síncrona).
 * Retorna o valor real do OSRM quando já houver cache; caso contrário usa a
 * heurística de distância em linha reta com fator de malha viária.
 */
export function estimateLeg(from: LatLng, to: LatLng, mode: TransportMode): RouteLeg {
  const cached = legCache.get(legKey(from, to, mode));
  if (cached) return cached;
  const straight = haversineKm(from, to);
  const distanceKm = straight * 1.35;
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: durationFor(distanceKm, mode),
    isMock: true,
  };
}

interface OsrmTable {
  code: string;
  distances?: (number | null)[][];
  durations?: (number | null)[][];
}

/**
 * Pré-carrega a matriz real de distâncias/durações entre todos os pontos da
 * viagem, para que o otimizador trabalhe com dados de estrada reais.
 * Falhas são silenciosas: o app continua com a heurística.
 */
export async function warmupRoutes(points: LatLng[], mode: TransportMode): Promise<boolean> {
  if (!usesOpenStreetMap || points.length < 2 || points.length > 25) return false;
  const key = `table:${mode}:${points.map(coordKey).join("|")}`;
  const cached = cacheGet<Record<string, RouteLeg>>(key);
  if (cached) {
    Object.entries(cached).forEach(([k, v]) => legCache.set(k, v));
    return true;
  }
  try {
    const coords = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
    const data = await osrmQueue(() =>
      getJson<OsrmTable>(
        `${OSRM_URL}/table/v1/driving/${coords}?annotations=distance,duration`,
      ),
    );
    if (data.code !== "Ok" || !data.distances) return false;
    const store: Record<string, RouteLeg> = {};
    points.forEach((from, i) => {
      points.forEach((to, j) => {
        if (i === j) return;
        const meters = data.distances?.[i]?.[j];
        if (meters == null) return;
        const distanceKm = Number((meters / 1000).toFixed(2));
        const seconds = data.durations?.[i]?.[j] ?? undefined;
        const leg: RouteLeg = {
          distanceKm,
          durationMinutes: durationFor(distanceKm, mode, seconds ? seconds / 60 : undefined),
          isMock: false,
        };
        const k = legKey(from, to, mode);
        legCache.set(k, leg);
        store[k] = leg;
      });
    });
    cacheSet(key, store);
    return true;
  } catch {
    return false;
  }
}

export interface RouteGeometry {
  /** Pontos [lat, lng] do traçado real da rota. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  isMock: boolean;
}

interface OsrmRoute {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
}

/** Traçado real da rota passando por todas as paradas na ordem informada. */
export async function fetchRouteGeometry(
  points: LatLng[],
  mode: TransportMode,
): Promise<RouteGeometry | null> {
  if (points.length < 2) return null;
  const straightLine = (): RouteGeometry => {
    let distance = 0;
    for (let i = 1; i < points.length; i += 1) distance += haversineKm(points[i - 1]!, points[i]!) * 1.35;
    return {
      coordinates: points.map((p) => [p.latitude, p.longitude] as [number, number]),
      distanceKm: Number(distance.toFixed(2)),
      durationMinutes: durationFor(distance, mode),
      isMock: true,
    };
  };
  if (!usesOpenStreetMap || points.length > 25) return straightLine();

  const key = `route:${mode}:${points.map(coordKey).join("|")}`;
  const cached = cacheGet<RouteGeometry>(key);
  if (cached) return cached;
  try {
    const coords = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
    const data = await osrmQueue(() =>
      getJson<OsrmRoute>(
        `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      ),
    );
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) return straightLine();
    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const geometry: RouteGeometry = {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceKm,
      durationMinutes: durationFor(distanceKm, mode, route.duration / 60),
      isMock: false,
    };
    cacheSet(key, geometry);
    return geometry;
  } catch {
    return straightLine();
  }
}

export function googleMapsDirectionsUrl(points: LatLng[], mode: TransportMode): string {
  const travelmode =
    mode === "a_pe" ? "walking" : mode === "bicicleta" ? "bicycling" : mode === "transporte_publico" ? "transit" : "driving";
  if (points.length === 0) return "https://www.google.com/maps";
  const origin = `${points[0]!.latitude},${points[0]!.longitude}`;
  const destination = `${points[points.length - 1]!.latitude},${points[points.length - 1]!.longitude}`;
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("|");
  const params = new URLSearchParams({ api: "1", origin, destination, travelmode });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
