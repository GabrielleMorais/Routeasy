import { optimizeTrip } from "@/services/optimizer";
import { demoTrip } from "@/data/demo";
const trip = { ...demoTrip, startDate: "2026-09-08", endDate: "2026-09-09" };
const r = optimizeTrip(trip as any);
r.days.forEach(d=>console.log("DIA",d.dayNumber,d.date,"visitas:",d.items.filter(i=>i.itemType==="visita").length,d.totalDistance+"km",d.totalTravelMinutes+"min"));
console.log("nao incluidos:", r.unscheduled.map(u=>u.name));
