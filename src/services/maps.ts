/**
 * Camada de serviço de mapas/rotas.
 *
 * Enquanto não houver credenciais configuradas (VITE_MAPS_PROVIDER e a chave
 * correspondente), o app funciona com uma base de dados simulada e claramente
 * identificada como demonstração. Ao configurar a API, basta implementar as
 * funções abaixo com chamadas reais — a interface não muda.
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

export const mapsProvider = (import.meta.env["VITE_MAPS_PROVIDER"] as string | undefined) ?? "";
export const isMapsConfigured = Boolean(
  mapsProvider && import.meta.env["VITE_MAPS_PUBLIC_TOKEN"],
);

/** Base simulada de lugares (dados de demonstração). */
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
function pseudoCoords(seed: string): { latitude: number; longitude: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return {
    latitude: -23.55 + ((hash % 200) - 100) / 4000,
    longitude: -46.64 + ((Math.floor(hash / 200) % 200) - 100) / 4000,
  };
}

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const term = normalize(query.trim());
  if (!term) return [];
  await new Promise((r) => setTimeout(r, 250));
  if (isMapsConfigured) {
    // Integração real deve ser implementada aqui (Google Places / Mapbox Search).
    throw new Error("Provedor de mapas configurado, mas a busca real ainda não foi implementada.");
  }
  return MOCK_PLACES.filter(
    (p) => normalize(p.name).includes(term) || normalize(p.address).includes(term),
  ).map((p) => ({ ...p, isMock: true }));
}

export function geocodeAddress(address: string): { latitude: number; longitude: number } {
  const found = MOCK_PLACES.find((p) => normalize(p.address).includes(normalize(address)));
  if (found) return { latitude: found.latitude, longitude: found.longitude };
  return pseudoCoords(address);
}

const SPEEDS_KMH: Record<TransportMode, number> = {
  carro: 26,
  transporte_publico: 17,
  bicicleta: 13,
  a_pe: 4.6,
};

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimativa de trajeto. Com API configurada, substituir por Directions/Matrix. */
export function estimateLeg(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  mode: TransportMode,
): RouteLeg {
  const straight = haversineKm(from, to);
  const distanceKm = straight * 1.35; // fator de malha viária
  const overhead = mode === "transporte_publico" ? 8 : mode === "carro" ? 4 : 2;
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.max(3, Math.round((distanceKm / SPEEDS_KMH[mode]) * 60) + overhead),
    isMock: true,
  };
}

export function googleMapsDirectionsUrl(
  points: { latitude: number; longitude: number }[],
  mode: TransportMode,
): string {
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
