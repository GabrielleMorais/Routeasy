import { optimizeTrip } from "@/services/optimizer";
import type { Place, Trip } from "@/types/trip";
const P = (n: string, lat: number, lng: number, extra: Partial<Place> = {}): Place => ({ id:n,name:n,category:"ponto_turistico",address:n,latitude:lat,longitude:lng,visitDurationMinutes:60,priority:"quero_conhecer",...extra });
const one: Trip = { id:"t",title:"T",destination:"SP",startDate:"2026-09-10",endDate:"2026-09-10",accommodationAddress:"a",accommodationLatitude:-23.568,accommodationLongitude:-46.649,dailyStartTime:"09:00",dailyEndTime:"19:00",transportMode:"carro",travelPace:"equilibrado",status:"planejado",shareToken:"x",isPublic:false,autoOptimizeOrder:true,
 places:[P("Ibirapuera",-23.5874,-46.6576),P("Mercadao",-23.5417,-46.6294,{isLocked:true}),P("Batman",-23.5545,-46.69),P("MASP",-23.5614,-46.6559,{fixedDate:"2026-09-10",fixedStartTime:"10:00"})],
 preferences:{returnToAccommodation:true,maxTravelMinutes:45,includeLunch:true,lunchTime:"12:30",lunchDurationMinutes:60,includeDinner:false,dinnerTime:"19:30",avoidTolls:false,avoidLongWalks:false,accessibleOptions:false},createdAt:"",updatedAt:"" };
const r = optimizeTrip(one);
r.days.forEach(d=>console.log(d.items.map(i=>`${i.startTime} ${i.itemType}:${i.title}`).join("\n")));
console.log(r.unscheduled);
