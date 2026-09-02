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
  externalPlaceId?: string | undefined;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | undefined;
  rating?: number | undefined;
  openingHours?: OpeningHours | undefined;
  visitDurationMinutes: number;
  priority: Priority;
  notes?: string | undefined;
  mealTag?: MealTag | undefined;
  fixedDate?: string | undefined;
  fixedStartTime?: string | undefined;
  isLocked?: boolean | undefined;
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
  accommodationName?: string | undefined;
  accommodationAddress: string;
  accommodationLatitude: number;
  accommodationLongitude: number;
  accommodationPlaceId?: string | undefined;
  accommodationSource?: "nominatim" | "manual" | undefined;

  dailyStartTime: string;
  dailyEndTime: string;
  transportMode: TransportMode;
  travelPace: TravelPace;
  status: TripStatus;
  shareToken: string;
  isPublic: boolean;
  isDemo?: boolean | undefined;
  /** Quando true (padrão), o app reorganiza a ordem dos lugares para reduzir deslocamentos. */
  autoOptimizeOrder?: boolean | undefined;

  places: Place[];
  preferences: TripPreferences;
  itinerary?: ItineraryDay[] | undefined;
  unscheduled?: UnscheduledPlace[] | undefined;
  createdAt: string;
  updatedAt: string;
}

export type ItemType = "visita" | "deslocamento" | "refeicao" | "partida" | "retorno" | "livre";
export type ItemStatus = "pendente" | "concluido" | "pulado";

export interface ItineraryItem {
  id: string;
  placeId?: string | undefined;
  itemType: ItemType;
  title: string;
  position: number;
  startTime: string;
  endTime: string;
  travelMinutes?: number | undefined;
  travelDistance?: number | undefined;
  transportMode?: TransportMode | undefined;
  status: ItemStatus;
  warning?: string | undefined;
  address?: string | undefined;
  notes?: string | undefined;
  category?: PlaceCategory | undefined;
  isLocked?: boolean | undefined;
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
