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
  /** Cidade/município, quando informado pelo provedor. */
  city?: string | undefined;
  /** Estado/província. */
  state?: string | undefined;
  country?: string | undefined;
  /** Tipo bruto do local no provedor (ex.: "restaurant", "road"). */
  placeType?: string | undefined;
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

/** Siglas de UF para comparar com o nome completo retornado pelo Nominatim. */
const UF_NAMES: Record<string, string> = {
  ac: "acre", al: "alagoas", ap: "amapa", am: "amazonas", ba: "bahia", ce: "ceara",
  df: "distrito federal", es: "espirito santo", go: "goias", ma: "maranhao",
  mt: "mato grosso", ms: "mato grosso do sul", mg: "minas gerais", pa: "para",
  pb: "paraiba", pr: "parana", pe: "pernambuco", pi: "piaui", rj: "rio de janeiro",
  rn: "rio grande do norte", rs: "rio grande do sul", ro: "rondonia", rr: "roraima",
  sc: "santa catarina", sp: "sao paulo", se: "sergipe", to: "tocantins",
};

/**
 * Reordena resultados priorizando a cidade/UF do destino da viagem
 * (ex.: "São Paulo, SP"). Resultados de fora não são escondidos, apenas vão depois.
 */
export function prioritizeByDestination(results: GeoResult[], destination?: string): GeoResult[] {
  const parts = (destination ?? "").split(",").map((p) => normalize(p.trim())).filter(Boolean);
  if (parts.length === 0 || results.length === 0) return results;
  const city = parts[0]!;
  const uf = parts[1]?.length === 2 ? UF_NAMES[parts[1]] : parts[1];

  function score(r: GeoResult): number {
    const resultCity = normalize(r.city ?? "");
    const resultState = normalize(r.state ?? "");
    if (resultCity && (resultCity === city || resultCity.includes(city) || city.includes(resultCity))) return 0;
    if (uf && resultState && (resultState === uf || resultState.includes(uf))) return 1;
    return 2;
  }
  return [...results].sort((a, b) => score(a) - score(b));
}

/* Sem coordenadas fictícias: endereços do usuário só são aceitos após geocodificação real. */


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
  address?: Record<string, string>;
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
  const a = item.address ?? {};
  return {
    externalPlaceId: `osm:${item.osm_type ?? "n"}${item.osm_id ?? item.place_id}`,
    name,
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    category: toCategory(item),
    city: a["city"] ?? a["town"] ?? a["village"] ?? a["municipality"] ?? a["county"],
    state: a["state"] ?? a["region"],
    country: a["country"],
    placeType: item.type ?? item.class,
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
    if (results.length === 0) return [];
    cacheSet(key, results);
    return results;
  } catch (error) {
    // Sem dados fictícios: a falha é informada para que o usuário cadastre manualmente.
    throw error;
  }
}



/** Motivo da falha de geocodificação: endereço inexistente x serviço indisponível. */
export type GeocodeErrorKind = "empty" | "not_found" | "service";

export class GeocodeError extends Error {
  readonly kind: GeocodeErrorKind;
  constructor(kind: GeocodeErrorKind, message: string) {
    super(message);
    this.name = "GeocodeError";
    this.kind = kind;
  }
}

export function geocodeErrorMessage(error: unknown): string {
  if (error instanceof GeocodeError) return error.message;
  return "Não foi possível validar o endereço agora. Tente novamente em alguns segundos.";
}

/**
 * Geocodificação apenas para a base de demonstração (fluxo de demo/offline).
 * Retorna `null` quando o endereço não existe na base — nunca inventa coordenadas.
 */
export function geocodeDemoAddress(address: string): LatLng | null {
  const term = normalize(address.trim());
  if (!term) return null;
  const found = MOCK_PLACES.find((p) => normalize(p.address).includes(term));
  return found ? { latitude: found.latitude, longitude: found.longitude } : null;
}

/**
 * Geocodificação real via Nominatim, com cache.
 * Lança `GeocodeError` quando o endereço não existe ou o serviço falha.
 * Nunca retorna coordenadas fictícias.
 */
export async function geocodeAddressAsync(address: string): Promise<LatLng> {
  const term = address.trim();
  if (!term) throw new GeocodeError("empty", "Informe um endereço para validar.");
  const key = `geo:${normalize(term)}`;
  const cached = cacheGet<LatLng>(key);
  if (cached) return cached;

  if (!usesOpenStreetMap) {
    const demo = geocodeDemoAddress(term);
    if (demo) return demo;
    throw new GeocodeError("not_found", "Endereço não encontrado. Revise o texto e tente novamente.");
  }

  let items: NominatimItem[];
  try {
    const params = new URLSearchParams({
      q: term,
      format: "jsonv2",
      limit: "1",
      "accept-language": "pt-BR",
    });
    items = await nominatimQueue(() =>
      getJson<NominatimItem[]>(`${NOMINATIM_URL}/search?${params.toString()}`),
    );
  } catch {
    throw new GeocodeError(
      "service",
      "Não foi possível validar o endereço agora. Verifique sua conexão e tente novamente.",
    );
  }

  const first = items[0];
  if (!first) {
    throw new GeocodeError("not_found", "Endereço não encontrado. Revise o texto e tente novamente.");
  }
  const coords = { latitude: Number(first.lat), longitude: Number(first.lon) };
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    throw new GeocodeError("service", "Resposta inválida do serviço de endereços. Tente novamente.");
  }
  cacheSet(key, coords);
  return coords;
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

/* -------------------------------------------------------------------------- */
/* Links externos de navegação (sem chave/API)                                  */
/* -------------------------------------------------------------------------- */

/** Deep link do Waze: abre o app no celular ou a versão web no navegador. */
export function wazeNavigationUrl(destination: LatLng): string {
  return `https://waze.com/ul?ll=${destination.latitude}%2C${destination.longitude}&navigate=yes`;
}

/** Coordenadas válidas para gerar um trecho do Moovit. */
export function hasValidLeg(origin?: LatLng, destination?: LatLng): boolean {
  return !!origin && !!destination && isValidCoord(origin) && isValidCoord(destination);
}

export interface MoovitLeg {
  originLat: number;
  originLon: number;
  originName: string;
  destinationLat: number;
  destinationLon: number;
  destinationName: string;
}

/** Valida um trecho: coordenadas numéricas nos limites corretos e nomes preenchidos. */
export function isValidMoovitLeg(leg: MoovitLeg): boolean {
  const { originLat, originLon, destinationLat, destinationLon, originName, destinationName } = leg;
  const coords = [originLat, originLon, destinationLat, destinationLon];
  if (coords.some((v) => typeof v !== "number" || !Number.isFinite(v))) return false;
  if (originLat < -90 || originLat > 90 || destinationLat < -90 || destinationLat > 90) return false;
  if (originLon < -180 || originLon > 180 || destinationLon < -180 || destinationLon > 180)
    return false;
  if (!originName?.trim() || !destinationName?.trim()) return false;
  // Origem e destino precisam ser pontos diferentes.
  if (originLat === destinationLat && originLon === destinationLon) return false;
  return true;
}

/** Deep link oficial do app Moovit para um trecho com origem e destino reais. */
export function createMoovitAppLink(leg: MoovitLeg): string {
  const params = new URLSearchParams({
    orig_lat: String(leg.originLat),
    orig_lon: String(leg.originLon),
    orig_name: leg.originName,
    dest_lat: String(leg.destinationLat),
    dest_lon: String(leg.destinationLon),
    dest_name: leg.destinationName,
    auto_run: "true",
    partner_id: "Routeasy",
  });
  return `moovit://directions?${params.toString()}`;
}

/** Alternativa web oficial do Moovit: abre o destino (não o trajeto completo). */
export function createMoovitWebLink(leg: MoovitLeg): string {
  const params = new URLSearchParams({
    lang: "pt-br",
    to: leg.destinationName,
    tll: `${leg.destinationLat}_${leg.destinationLon}`,
  });
  return `https://www.moovit.com/?${params.toString()}`;
}

/** Detecta celular/tablet para escolher entre deeplink do app e versão web. */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** Quais aplicativos de navegação fazem sentido para cada meio de transporte. */
export function navigationApps(mode: TransportMode): { waze: boolean; moovit: boolean } {
  return {
    waze: mode === "carro",
    moovit: mode === "transporte_publico",
  };
}

/* -------------------------------------------------------------------------- */
/* Fonte única de distância e tempo de deslocamento                             */
/* -------------------------------------------------------------------------- */

export interface RouteMetrics {
  distanceKm: number;
  travelMinutes: number;
  source: "osrm" | "estimate";
  includesReturnToStart: boolean;
}

/**
 * Métrica única da rota: soma apenas os trechos de deslocamento, na mesma ordem
 * e com a mesma regra usada pelo otimizador (`estimateLeg`, que reaproveita o
 * cache real do OSRM quando disponível).
 */
export function computeRouteMetrics(
  points: LatLng[],
  mode: TransportMode,
  includesReturnToStart = false,
): RouteMetrics {
  let distanceKm = 0;
  let travelMinutes = 0;
  let real = points.length > 1;
  for (let i = 1; i < points.length; i += 1) {
    const leg = estimateLeg(points[i - 1]!, points[i]!, mode);
    distanceKm += leg.distanceKm;
    travelMinutes += leg.durationMinutes;
    if (leg.isMock) real = false;
  }
  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    travelMinutes: Math.round(travelMinutes),
    source: real ? "osrm" : "estimate",
    includesReturnToStart,
  };
}



/* -------------------------------------------------------------------------- */
/* Sugestões de lugares próximos (Overpass API / OpenStreetMap)                 */
/* -------------------------------------------------------------------------- */

export type NearbyCategory = "turismo" | "cultura" | "parques" | "restaurantes" | "cafes" | "compras";

export const NEARBY_CATEGORY_LABELS: Record<NearbyCategory, string> = {
  turismo: "Turismo",
  cultura: "Museus e cultura",
  parques: "Parques",
  restaurantes: "Restaurantes",
  cafes: "Cafés",
  compras: "Compras",
};

/** Servidores públicos da Overpass API, tentados em ordem se um falhar. */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OVERPASS_FILTERS: Record<NearbyCategory, string[]> = {
  turismo: ['["tourism"~"^(attraction|viewpoint)$"]'],
  cultura: ['["tourism"="museum"]', '["amenity"="arts_centre"]'],
  parques: ['["leisure"~"^(park|garden)$"]'],
  restaurantes: ['["amenity"="restaurant"]'],
  cafes: ['["amenity"="cafe"]'],
  compras: ['["shop"]', '["tourism"="mall"]'],
};


const NEARBY_CATEGORY_TO_PLACE: Record<NearbyCategory, PlaceCategory> = {
  turismo: "ponto_turistico",
  cultura: "museu",
  parques: "parque",
  restaurantes: "restaurante",
  cafes: "cafe",
  compras: "compras",
};

export interface NearbySuggestion {
  externalPlaceId: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function tagsToAddress(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", "),
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(" — ");
}

/** Tempo máximo de espera por servidor Overpass (3,5 s — total nunca passa de 7 s). */
const OVERPASS_TIMEOUT_MS = 3_500;


/** Cache das sugestões por categoria + coordenada, válido por 10 minutos. */
const NEARBY_TTL_MS = 10 * 60 * 1000;
const nearbyCache = new Map<string, { expiresAt: number; value: NearbySuggestion[] }>();

function nearbyCacheGet(key: string): NearbySuggestion[] | undefined {
  const entry = nearbyCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    nearbyCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function nearbyCacheSet(key: string, value: NearbySuggestion[]) {
  nearbyCache.set(key, { expiresAt: Date.now() + NEARBY_TTL_MS, value });
}

function isValidCoord(c: LatLng): boolean {
  return (
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    Math.abs(c.latitude) <= 90 &&
    Math.abs(c.longitude) <= 180 &&
    !(c.latitude === 0 && c.longitude === 0)
  );
}

/**
 * Consulta um servidor Overpass com timeout próprio.
 * Lança erro em falha de rede, HTTP não-2xx ou timeout.
 */
async function queryOverpass(
  endpoint: string,
  body: string,
  signal?: AbortSignal,
): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Tempo limite excedido")), OVERPASS_TIMEOUT_MS);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(body)}`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { elements?: OverpassElement[] };
    return data.elements ?? [];
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Busca lugares reais do OpenStreetMap por categoria e proximidade (Overpass).
 * Uma única consulta compacta cobre todos os centros de referência (1º e 2º
 * lugares do roteiro). Cache de 10 minutos por categoria + coordenadas.
 * Se as duas instâncias falharem, lança erro — nunca devolve dados fictícios.
 */
export async function fetchNearbyPlaces(
  centers: LatLng[],
  category: NearbyCategory,
  radiusMeters = 1500,
  signal?: AbortSignal,
): Promise<NearbySuggestion[]> {
  const valid = centers.filter(isValidCoord);
  if (valid.length === 0) {
    throw new Error("Adicione ao menos um lugar com coordenadas válidas ao roteiro.");
  }
  const key = `nearby:${category}:${valid.map(coordKey).join("|")}:${radiusMeters}`;
  const cached = nearbyCacheGet(key);
  if (cached) return cached;

  // Uma consulta única: cada filtro da categoria é aplicado a todos os centros.
  const arounds = valid.map((c) => `(around:${radiusMeters},${c.latitude},${c.longitude})`);
  const body = `[out:json][timeout:6];(${OVERPASS_FILTERS[category]
    .map((f) => arounds.map((a) => `node${f}${a};way${f}${a};`).join(""))
    .join("")});out tags center 40;`;

  let elements: OverpassElement[] | null = null;
  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("AbortError", "AbortError");
    try {
      elements = await queryOverpass(endpoint, body, signal);
      break;
    } catch (error) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("AbortError", "AbortError");
      lastError = error;
    }
  }
  if (elements === null) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Todos os servidores do OpenStreetMap falharam.");
  }

  const seen = new Set<string>();
  const suggestions: NearbySuggestion[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags["name"]?.trim();
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || lat == null || lon == null) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    // Deduplicação por osm_id (tipo + id).
    const osmId = `${el.type}${el.id}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);
    const distanceKm = Math.min(
      ...valid.map((c) => haversineKm(c, { latitude: lat, longitude: lon })),
    );
    suggestions.push({
      externalPlaceId: `osm:${osmId}`,
      name,
      category: NEARBY_CATEGORY_TO_PLACE[category],
      categoryLabel: NEARBY_CATEGORY_LABELS[category],
      address: tagsToAddress(tags),
      latitude: lat,
      longitude: lon,
      distanceKm: Number(distanceKm.toFixed(2)),
    });
  }

  const top = suggestions.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 8);
  nearbyCacheSet(key, top);
  return top;
}
