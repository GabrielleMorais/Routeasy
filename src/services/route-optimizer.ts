/**
 * Serviço de otimização da ORDEM dos lugares (independente da interface).
 *
 * Trabalha somente com dados: recebe a viagem, consulta a matriz de durações
 * reais do OSRM (via `warmupRoutes` / `estimateLeg`, que já possui cache) e
 * devolve uma ordem recomendada + a comparação entre a ordem atual e a
 * recomendada. Não conhece React nem componentes, o que permite trocar a
 * heurística por um algoritmo melhor no futuro.
 *
 * Heurística: vizinho mais próximo (menor duração de deslocamento) a partir do
 * ponto de partida confirmado, refinada por 2-opt. Lugares com horário fixo ou
 * bloqueados pelo usuário mantêm a posição atual.
 */
import { estimateLeg, warmupRoutes, type LatLng } from "./maps";
import type { Place, Trip } from "@/types/trip";

export interface RouteCost {
  distanceKm: number;
  minutes: number;
}

export function startPoint(trip: Trip): LatLng {
  return { latitude: trip.accommodationLatitude, longitude: trip.accommodationLongitude };
}

/** Custo total (distância + duração) de percorrer os lugares na ordem informada. */
export function routeCost(
  start: LatLng,
  places: Place[],
  mode: Trip["transportMode"],
  returnToStart: boolean,
): RouteCost {
  let distanceKm = 0;
  let minutes = 0;
  let current: LatLng = start;
  places.forEach((place) => {
    const leg = estimateLeg(current, place, mode);
    distanceKm += leg.distanceKm;
    minutes += leg.durationMinutes;
    current = place;
  });
  if (returnToStart && places.length > 0) {
    const leg = estimateLeg(current, start, mode);
    distanceKm += leg.distanceKm;
    minutes += leg.durationMinutes;
  }
  return { distanceKm: Number(distanceKm.toFixed(2)), minutes: Math.round(minutes) };
}

function nearestNeighbor(start: LatLng, places: Place[], mode: Trip["transportMode"]): Place[] {
  const pending = [...places];
  const ordered: Place[] = [];
  let current: LatLng = start;
  while (pending.length > 0) {
    let bestIndex = 0;
    let bestMinutes = Number.POSITIVE_INFINITY;
    pending.forEach((place, index) => {
      const { durationMinutes } = estimateLeg(current, place, mode);
      if (durationMinutes < bestMinutes) {
        bestMinutes = durationMinutes;
        bestIndex = index;
      }
    });
    const [next] = pending.splice(bestIndex, 1);
    ordered.push(next!);
    current = next!;
  }
  return ordered;
}

/** Refinamento 2-opt: inverte trechos enquanto houver redução de tempo. */
function twoOpt(
  start: LatLng,
  places: Place[],
  mode: Trip["transportMode"],
  returnToStart: boolean,
): Place[] {
  let best = [...places];
  let bestMinutes = routeCost(start, best, mode, returnToStart).minutes;
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 30) {
    improved = false;
    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const minutes = routeCost(start, candidate, mode, returnToStart).minutes;
        if (minutes < bestMinutes - 0.001) {
          best = candidate;
          bestMinutes = minutes;
          improved = true;
        }
      }
    }
  }
  return best;
}

const isPinned = (place: Place) => Boolean(place.isLocked || place.fixedStartTime);

/**
 * Ordem recomendada dos lugares. Lugares bloqueados ou com horário fixo
 * permanecem exatamente na posição atual; os demais são reorganizados.
 */
export function recommendOrder(trip: Trip): Place[] {
  const places = trip.places;
  if (places.length < 3) return [...places];
  const free = places.filter((p) => !isPinned(p));
  if (free.length < 2) return [...places];

  const start = startPoint(trip);
  const mode = trip.transportMode;
  const returnToStart = trip.preferences.returnToAccommodation;
  const optimizedFree = twoOpt(start, nearestNeighbor(start, free, mode), mode, returnToStart);

  const queue = [...optimizedFree];
  return places.map((place) => (isPinned(place) ? place : queue.shift()!));
}

export interface OrderComparison {
  currentOrder: string[];
  recommendedOrder: string[];
  recommendedPlaces: Place[];
  currentDistance: number;
  recommendedDistance: number;
  currentMinutes: number;
  recommendedMinutes: number;
  savedDistance: number;
  savedMinutes: number;
  /** true quando a rota recomendada reduz tempo ou distância de forma relevante. */
  improved: boolean;
  /** false quando o OSRM não respondeu e usamos proximidade geográfica. */
  usedRealRoutes: boolean;
}

/**
 * Compara a ordem atual com a ordem recomendada usando as durações reais do
 * OSRM (quando disponíveis). Se o serviço estiver indisponível, o cálculo cai
 * automaticamente para a proximidade geográfica.
 */
export async function buildOrderComparison(trip: Trip): Promise<OrderComparison> {
  const start = startPoint(trip);
  const usedRealRoutes = await warmupRoutes(
    [start, ...trip.places.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))],
    trip.transportMode,
  );

  const returnToStart = trip.preferences.returnToAccommodation;
  const current = routeCost(start, trip.places, trip.transportMode, returnToStart);
  const recommendedPlaces = recommendOrder(trip);
  const recommended = routeCost(start, recommendedPlaces, trip.transportMode, returnToStart);

  const savedMinutes = Math.round(current.minutes - recommended.minutes);
  const savedDistance = Number((current.distanceKm - recommended.distanceKm).toFixed(1));

  return {
    currentOrder: trip.places.map((p) => p.name),
    recommendedOrder: recommendedPlaces.map((p) => p.name),
    recommendedPlaces,
    currentDistance: Number(current.distanceKm.toFixed(1)),
    recommendedDistance: Number(recommended.distanceKm.toFixed(1)),
    currentMinutes: current.minutes,
    recommendedMinutes: recommended.minutes,
    savedDistance,
    savedMinutes,
    improved: savedMinutes >= 1 || savedDistance >= 0.1,
    usedRealRoutes,
  };
}
