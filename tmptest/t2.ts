import { demoTrip } from "@/data/demo";
import { estimateLeg } from "@/services/maps";
const t = demoTrip;
const acc = {latitude:t.accommodationLatitude, longitude:t.accommodationLongitude};
for (const id of ["demo-figueira","demo-catavento","demo-pinacoteca","demo-liberdade"]) {
  const p = t.places.find(x=>x.id===id)!;
  const leg = estimateLeg(acc, p, t.transportMode);
  const arrival = 510+leg.durationMinutes;
  console.log(p.name, leg, arrival, arrival+p.visitDurationMinutes, p.openingHours, new Date("2026-09-06").getDay());
}
