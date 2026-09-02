export type TransportMode = "carro" | "transporte_publico" | "bicicleta" | "a_pe";
export type TravelPace = "tranquilo" | "equilibrado" | "intenso";
export type PlaceCategory =
  | "ponto_turistico"
  | "restaurante"
  | "cafe"
  | "museu"
  | "parque"
  | "compras"
  | "evento"
  | "hotel"
  | "outro";
export type Priority = "imperdivel" | "quero_conhecer" | "opcional";
export type MealTag = "almoco" | "jantar" | null;
export type TripStatus = "rascunho" | "planejado" | "concluido";

/** Horário de funcionamento por dia da semana (0 = domingo). */
export interface OpeningHours {
  /** minutos desde 00:00 */
  open: number;
  close: number;
  /** dias da semana em que abre */
  weekdays: number[];
}

export interface Place {
  id: string;
  externalPlaceId?: string;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  rating?: number;
  openingHours?: OpeningHours;
  visitDurationMinutes: number;
  priority: Priority;
  notes?: string;
  mealTag?: MealTag;
  fixedDate?: string;
  fixedStartTime?: string;
  isLocked?: boolean;
}

export interface TripPreferences {
  returnToAccommodation: boolean;
  maxTravelMinutes: number;
  includeLunch: boolean;
  lunchTime: string;
  lunchDurationMinutes: number;
  includeDinner: boolean;
  dinnerTime: string;
  avoidTolls: boolean;
  avoidLongWalks: boolean;
  accessibleOptions: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  accommodationAddress: string;
  accommodationLatitude: number;
  accommodationLongitude: number;
  dailyStartTime: string;
  dailyEndTime: string;
  transportMode: TransportMode;
  travelPace: TravelPace;
  status: TripStatus;
  shareToken: string;
  isPublic: boolean;
  isDemo?: boolean;
  places: Place[];
  preferences: TripPreferences;
  itinerary?: ItineraryDay[];
  unscheduled?: UnscheduledPlace[];
  createdAt: string;
  updatedAt: string;
}

export type ItemType = "visita" | "deslocamento" | "refeicao" | "partida" | "retorno" | "livre";
export type ItemStatus = "pendente" | "concluido" | "pulado";

export interface ItineraryItem {
  id: string;
  placeId?: string;
  itemType: ItemType;
  title: string;
  position: number;
  startTime: string;
  endTime: string;
  travelMinutes?: number;
  travelDistance?: number;
  transportMode?: TransportMode;
  status: ItemStatus;
  warning?: string;
  address?: string;
  notes?: string;
  category?: PlaceCategory;
  isLocked?: boolean;
}

export interface ItineraryDay {
  id: string;
  date: string;
  dayNumber: number;
  totalDistance: number;
  totalTravelMinutes: number;
  items: ItineraryItem[];
}

export interface UnscheduledPlace {
  placeId: string;
  name: string;
  reason: string;
}
