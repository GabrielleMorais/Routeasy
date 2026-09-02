/**
 * Serviço de otimização de roteiro (heurística do MVP).
 *
 * Independente da interface: recebe uma viagem e devolve os dias do itinerário
 * e a lista de lugares não incluídos. Pode ser substituído futuramente por um
 * algoritmo mais avançado ou por uma API externa sem alterar a UI.
 */
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type {
  ItineraryDay,
  ItineraryItem,
  Place,
  Trip,
  UnscheduledPlace,
} from "@/types/trip";
import { estimateLeg } from "./maps";

export const PACE_TARGET: Record<Trip["travelPace"], number> = {
  tranquilo: 3,
  equilibrado: 4,
  intenso: 5,
};

const PRIORITY_WEIGHT: Record<Place["priority"], number> = {
  imperdivel: 0,
  quero_conhecer: 1,
  opcional: 2,
};

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toTime(minutes: number): string {
  const clamped = Math.max(0, Math.round(minutes));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function tripDates(trip: Trip): string[] {
  const start = parseISO(trip.startDate);
  const total = Math.max(0, differenceInCalendarDays(parseISO(trip.endDate), start)) + 1;
  return Array.from({ length: total }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

function isOpen(place: Place, date: string, startMin: number, endMin: number): boolean {
  const oh = place.openingHours;
  if (!oh) return true;
  const weekday = parseISO(date).getDay();
  if (!oh.weekdays.includes(weekday)) return false;
  return startMin >= oh.open && endMin <= oh.close;
}

/** Tempo máximo que aceitamos esperar por um local que ainda não abriu. */
const MAX_WAIT_MINUTES = 90;

/**
 * Retorna o horário de início possível para a visita considerando o horário de
 * funcionamento (permite aguardar a abertura) ou `null` se não for viável no dia.
 */
function startWithinOpening(place: Place, date: string, arrival: number): number | null {
  const oh = place.openingHours;
  if (!oh) return arrival;
  const weekday = parseISO(date).getDay();
  if (!oh.weekdays.includes(weekday)) return null;
  const start = Math.max(arrival, oh.open);
  if (start - arrival > MAX_WAIT_MINUTES) return null;
  if (start + place.visitDurationMinutes > oh.close) return null;
  return start;
}


let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

export interface OptimizationResult {
  days: ItineraryDay[];
  unscheduled: UnscheduledPlace[];
}

export function optimizeTrip(trip: Trip): OptimizationResult {
  const dates = tripDates(trip);
  const dayStart = toMinutes(trip.dailyStartTime);
  const dayEnd = toMinutes(trip.dailyEndTime);
  const accommodation = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };
  const target = PACE_TARGET[trip.travelPace];
  const prefs = trip.preferences;
  /** Organização automática ligada por padrão (reduz deslocamentos). */
  const autoOrder = trip.autoOptimizeOrder !== false;
  const orderIndex = new Map(trip.places.map((p, i) => [p.id, i] as const));


  const pending = trip.places.filter((p) => p.category !== "hotel");
  const remaining = new Set(pending.map((p) => p.id));
  const byId = new Map(pending.map((p) => [p.id, p]));
  const unscheduled: UnscheduledPlace[] = [];
  const days: ItineraryDay[] = [];

  dates.forEach((date, index) => {
    const items: ItineraryItem[] = [];
    let cursor = dayStart;
    let position = 0;
    let current = accommodation;
    let totalDistance = 0;
    let totalTravel = 0;
    let visits = 0;
    let lunchDone = !prefs.includeLunch;
    let dinnerDone = !prefs.includeDinner;

    items.push({
      id: uid("item"),
      itemType: "partida",
      title: "Saída da hospedagem",
      position: position++,
      startTime: toTime(cursor),
      endTime: toTime(cursor),
      status: "pendente",
      address: trip.accommodationAddress,
    });

    const pushMeal = (kind: "almoco" | "jantar", startMin: number, duration: number) => {
      items.push({
        id: uid("item"),
        itemType: "refeicao",
        title: kind === "almoco" ? "Intervalo para almoço" : "Intervalo para jantar",
        position: position++,
        startTime: toTime(startMin),
        endTime: toTime(startMin + duration),
        status: "pendente",
      });
    };

    // Lugares com data fixa para este dia entram primeiro.
    const fixedToday = pending
      .filter((p) => remaining.has(p.id) && p.fixedDate === date && p.fixedStartTime)
      .sort((a, b) => toMinutes(a.fixedStartTime!) - toMinutes(b.fixedStartTime!));

    const scheduleVisit = (place: Place, forcedStart?: number): boolean => {
      const leg = estimateLeg(current, place, trip.transportMode);
      let arrival = cursor + leg.durationMinutes;
      if (forcedStart !== undefined) arrival = Math.max(arrival, forcedStart);
      const possibleStart =
        forcedStart !== undefined ? arrival : startWithinOpening(place, date, arrival);
      if (possibleStart === null) return false;
      arrival = possibleStart;
      const departure = arrival + place.visitDurationMinutes;
      if (departure > dayEnd) return false;
      if (forcedStart !== undefined && !isOpen(place, date, arrival, departure)) return false;


      items.push({
        id: uid("item"),
        itemType: "deslocamento",
        title: "Deslocamento",
        position: position++,
        startTime: toTime(cursor),
        endTime: toTime(cursor + leg.durationMinutes),
        travelMinutes: leg.durationMinutes,
        travelDistance: leg.distanceKm,
        transportMode: trip.transportMode,
        status: "pendente",
        warning:
          leg.durationMinutes > prefs.maxTravelMinutes
            ? "Deslocamento acima do tempo máximo desejado"
            : undefined,
      });
      items.push({
        id: uid("item"),
        placeId: place.id,
        itemType: place.mealTag ? "refeicao" : "visita",
        title: place.name,
        position: position++,
        startTime: toTime(arrival),
        endTime: toTime(departure),
        status: "pendente",
        address: place.address,
        notes: place.notes,
        category: place.category,
        isLocked: place.isLocked,
      });

      totalDistance += leg.distanceKm;
      totalTravel += leg.durationMinutes;
      cursor = departure;
      current = place;
      remaining.delete(place.id);
      if (place.mealTag === "almoco") lunchDone = true;
      else if (place.mealTag === "jantar") dinnerDone = true;
      else visits += 1;

      return true;
    };

    fixedToday.forEach((place) => {
      const ok = scheduleVisit(place, toMinutes(place.fixedStartTime!));
      if (!ok) {
        remaining.delete(place.id);
        unscheduled.push({
          placeId: place.id,
          name: place.name,
          reason: "O horário fixo informado não cabe na janela disponível do dia.",
        });
      }
    });

    let guard = 0;
    while (visits < target && remaining.size > 0 && guard++ < 40) {
      if (!lunchDone && cursor >= toMinutes(prefs.lunchTime)) {
        pushMeal("almoco", cursor, prefs.lunchDurationMinutes);
        cursor += prefs.lunchDurationMinutes;
        lunchDone = true;
        continue;
      }
      if (!dinnerDone && cursor >= toMinutes(prefs.dinnerTime)) {
        pushMeal("jantar", cursor, 60);
        cursor += 60;
        dinnerDone = true;
        continue;
      }

      const candidates = [...remaining]
        .map((id) => byId.get(id)!)
        .filter((p) => !p.fixedDate || p.fixedDate === date)
        .map((p) => {
          const leg = estimateLeg(current, p, trip.transportMode);
          const arrival = cursor + leg.durationMinutes;
          const start = startWithinOpening(p, date, arrival);
          return { place: p, leg, start, departure: (start ?? 0) + p.visitDurationMinutes };
        })
        .filter((c) => c.start !== null && c.departure <= dayEnd)
        .sort(
          (a, b) =>
            PRIORITY_WEIGHT[a.place.priority] - PRIORITY_WEIGHT[b.place.priority] ||
            a.leg.durationMinutes - b.leg.durationMinutes,
        );

      const next = candidates[0];
      if (!next) break;
      if (!scheduleVisit(next.place)) break;
    }


    if (prefs.returnToAccommodation && items.length > 1) {
      const leg = estimateLeg(current, accommodation, trip.transportMode);
      items.push({
        id: uid("item"),
        itemType: "retorno",
        title: "Retorno à hospedagem",
        position: position++,
        startTime: toTime(cursor),
        endTime: toTime(cursor + leg.durationMinutes),
        travelMinutes: leg.durationMinutes,
        travelDistance: leg.distanceKm,
        transportMode: trip.transportMode,
        status: "pendente",
        address: trip.accommodationAddress,
      });
      totalDistance += leg.distanceKm;
      totalTravel += leg.durationMinutes;
    }

    days.push({
      id: uid("day"),
      date,
      dayNumber: index + 1,
      totalDistance: Number(totalDistance.toFixed(1)),
      totalTravelMinutes: totalTravel,
      items,
    });
  });

  remaining.forEach((id) => {
    const place = byId.get(id)!;
    unscheduled.push({
      placeId: id,
      name: place.name,
      reason:
        place.openingHours && dates.length > 0
          ? "Não foi possível encaixar dentro do horário de funcionamento e da janela diária disponível."
          : "Não houve tempo disponível nos dias da viagem com o ritmo escolhido.",
    });
  });

  return { days, unscheduled };
}

/** Recalcula os horários de um dia após uma edição manual, mantendo a ordem atual. */
export function recalculateDay(trip: Trip, day: ItineraryDay): ItineraryDay {
  const byId = new Map(trip.places.map((p) => [p.id, p]));
  let cursor = toMinutes(trip.dailyStartTime);
  let current = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };
  let totalDistance = 0;
  let totalTravel = 0;
  const dayEnd = toMinutes(trip.dailyEndTime);

  const stops = day.items.filter((i) => i.itemType !== "deslocamento" && i.itemType !== "partida");
  const items: ItineraryItem[] = [
    {
      id: `item-partida-${day.id}`,
      itemType: "partida",
      title: "Saída da hospedagem",
      position: 0,
      startTime: toTime(cursor),
      endTime: toTime(cursor),
      status: "pendente",
      address: trip.accommodationAddress,
    },
  ];
  let position = 1;

  stops.forEach((item) => {
    const place = item.placeId ? byId.get(item.placeId) : undefined;
    const duration = toMinutes(item.endTime) - toMinutes(item.startTime);
    if (place) {
      const leg = estimateLeg(current, place, trip.transportMode);
      items.push({
        id: `${item.id}-travel`,
        itemType: "deslocamento",
        title: "Deslocamento",
        position: position++,
        startTime: toTime(cursor),
        endTime: toTime(cursor + leg.durationMinutes),
        travelMinutes: leg.durationMinutes,
        travelDistance: leg.distanceKm,
        transportMode: trip.transportMode,
        status: "pendente",
        warning:
          leg.durationMinutes > trip.preferences.maxTravelMinutes
            ? "Deslocamento acima do tempo máximo desejado"
            : undefined,
      });
      cursor += leg.durationMinutes;
      totalDistance += leg.distanceKm;
      totalTravel += leg.durationMinutes;
      current = place;
    }
    const start = cursor;
    const end = start + Math.max(15, duration);
    const warnings: string[] = [];
    if (place && !isOpen(place, day.date, start, end)) warnings.push("Local fechado nesse horário");
    if (end > dayEnd) warnings.push("Ultrapassa o horário final do dia");
    items.push({
      ...item,
      position: position++,
      startTime: toTime(start),
      endTime: toTime(end),
      warning: warnings.length ? warnings.join(" · ") : undefined,
    });
    cursor = end;
  });

  return {
    ...day,
    items,
    totalDistance: Number(totalDistance.toFixed(1)),
    totalTravelMinutes: totalTravel,
  };
}
