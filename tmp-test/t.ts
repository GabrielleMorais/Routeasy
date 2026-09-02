import { optimizeTrip } from "@/services/optimizer";
import { buildOrderComparison, routeCost, startPoint } from "@/services/route-optimizer";
import type { Place, Trip } from "@/types/trip";

const P = (n: string, lat: number, lng: number, extra: Partial<Place> = {}): Place => ({
  id: n, name: n, category: "ponto_turistico", address: n, latitude: lat, longitude: lng,
  visitDurationMinutes: 60, priority: "quero_conhecer", ...extra,
});

const base: Trip = {
  id: "t", title: "Teste", destination: "São Paulo", startDate: "2026-09-10", endDate: "2026-09-11",
  accommodationAddress: "Paulista 900", accommodationLatitude: -23.568, accommodationLongitude: -46.649,
  dailyStartTime: "09:00", dailyEndTime: "19:00", transportMode: "carro", travelPace: "equilibrado",
  status: "planejado", shareToken: "x", isPublic: false, autoOptimizeOrder: true,
  places: [
    P("Ibirapuera", -23.5874, -46.6576), P("Mercadao", -23.5417, -46.6294),
    P("Batman", -23.5545, -46.69), P("MASP", -23.5614, -46.6559),
    P("Pinacoteca", -23.5343, -46.6337), P("Liberdade", -23.5587, -46.635),
    P("Catavento", -23.5473, -46.6262), P("Farol", -23.5464, -46.6342),
  ],
  preferences: { returnToAccommodation: true, maxTravelMinutes: 45, includeLunch: true, lunchTime: "12:30", lunchDurationMinutes: 60, includeDinner: false, dinnerTime: "19:30", avoidTolls: false, avoidLongWalks: false, accessibleOptions: false },
  createdAt: "", updatedAt: "",
};

const cmp = await buildOrderComparison(base);
console.log("real routes:", cmp.usedRealRoutes);
console.log("atual:", cmp.currentOrder.join(" > "), cmp.currentDistance, "km", cmp.currentMinutes, "min");
console.log("rec  :", cmp.recommendedOrder.join(" > "), cmp.recommendedDistance, "km", cmp.recommendedMinutes, "min");
console.log("economia:", cmp.savedDistance, "km", cmp.savedMinutes, "min, improved:", cmp.improved);

const applied = { ...base, places: cmp.recommendedPlaces };
const r = optimizeTrip(applied);
r.days.forEach(d => console.log(`Dia ${d.dayNumber}:`, d.items.filter(i=>i.itemType==="visita").map(i=>i.title).join(", "), "|", d.totalDistance,"km", d.totalTravelMinutes,"min"));
console.log("nao incluidos:", r.unscheduled.map(u=>u.name));

// 1 dia, 4 lugares em ordem ruim + horário fixo + bloqueado
const one: Trip = { ...base, endDate: base.startDate, places: [
  P("Batman", -23.5545, -46.69), P("Mercadao", -23.5417, -46.6294, { isLocked: true }),
  P("Ibirapuera", -23.5874, -46.6576), P("MASP", -23.5614, -46.6559, { fixedDate: "2026-09-10", fixedStartTime: "10:00" }),
]};
const c2 = await buildOrderComparison(one);
console.log("1 dia atual:", c2.currentOrder.join(" > "), c2.currentMinutes, "min");
console.log("1 dia rec  :", c2.recommendedOrder.join(" > "), c2.recommendedMinutes, "min");
const r2 = optimizeTrip({ ...one, places: c2.recommendedPlaces });
r2.days.forEach(d => console.log(`Dia ${d.dayNumber}:`, d.items.map(i=>`${i.startTime} ${i.title}`).join(" | ")));
console.log("nao incluidos:", r2.unscheduled.map(u=>u.name));
