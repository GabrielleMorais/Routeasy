import type { PlaceCategory, Priority, TransportMode, TravelPace } from "@/types/trip";

export const categoryLabels: Record<PlaceCategory, string> = {
  ponto_turistico: "Ponto turístico",
  restaurante: "Restaurante",
  cafe: "Café",
  museu: "Museu",
  parque: "Parque",
  compras: "Compras",
  evento: "Evento",
  hotel: "Hotel",
  outro: "Outro",
};

export const priorityLabels: Record<Priority, string> = {
  imperdivel: "Imperdível",
  quero_conhecer: "Quero conhecer",
  opcional: "Opcional",
};

export const transportLabels: Record<TransportMode, string> = {
  carro: "Carro",
  transporte_publico: "Transporte público",
  bicicleta: "Bicicleta",
  a_pe: "A pé",
};

export const paceLabels: Record<TravelPace, string> = {
  tranquilo: "Tranquilo",
  equilibrado: "Equilibrado",
  intenso: "Intenso",
};

export const durationOptions = [
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora e 30 minutos" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
];

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
