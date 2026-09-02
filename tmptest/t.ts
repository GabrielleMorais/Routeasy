import { demoTrip } from "@/data/demo";
for (const d of demoTrip.itinerary ?? []) {
  console.log("DIA", d.dayNumber, d.date, d.items.filter(i=>i.itemType!=="deslocamento").map(i=>`${i.startTime} ${i.title}`));
}
console.log("NAO INCLUIDOS", demoTrip.unscheduled?.map(u=>u.name+" :: "+u.reason));
