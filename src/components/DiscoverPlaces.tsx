/**
 * Descoberta de lugares na etapa "Lugares" da criação do roteiro.
 *
 * - "Sugestões para você": lugares reais do OpenStreetMap próximos à
 *   hospedagem, com categorias orientadas pelos estilos de viagem.
 * - "Talvez você também goste": lugares próximos aos já escolhidos, com uma
 *   estimativa de impacto no deslocamento ("Fica no caminho" / "+X min").
 *
 * Sem IA e sem dados fictícios: tudo vem da Overpass API (fetchNearbyPlaces).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus, Compass, MapPin, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NEARBY_CATEGORY_LABELS,
  fetchNearbyPlaces,
  haversineKm,
  type LatLng,
  type NearbyCategory,
  type NearbySuggestion,
} from "@/services/maps";
import { createId } from "@/services/storage";
import type { Place, TransportMode, Trip, TripStyle } from "@/types/trip";

interface Props {
  trip: Trip;
  /** Retorne `false` quando o lugar for recusado (ex.: duplicado). */
  onAdd: (place: Place) => boolean | void;
  onWishlist: (place: Place) => boolean | void;
}

/** Velocidades médias usadas para estimar o impacto de um desvio (km/h). */
const MODE_SPEED_KMH: Record<TransportMode, number> = {
  carro: 30,
  transporte_publico: 20,
  bicicleta: 15,
  a_pe: 5,
};

/** Estilos de viagem → categorias de sugestão priorizadas. */
const STYLE_CATEGORIES: Record<TripStyle, NearbyCategory[]> = {
  gastronomia: ["restaurantes", "cafes"],
  cultura: ["cultura", "turismo"],
  natureza: ["parques"],
  compras: ["compras"],
  vida_noturna: ["restaurantes", "cafes"],
  turismo: ["turismo"],
  casal: ["turismo", "parques"],
  familia: ["parques", "turismo"],
  trabalho: ["cafes", "restaurantes"],
  economica: ["parques", "turismo"],
};

function categoriesForStyles(styles: TripStyle[] | undefined): NearbyCategory[] {
  const ordered: NearbyCategory[] = [];
  for (const style of styles ?? []) {
    for (const cat of STYLE_CATEGORIES[style]) {
      if (!ordered.includes(cat)) ordered.push(cat);
    }
  }
  if (ordered.length === 0) ordered.push("turismo", "parques");
  return ordered.slice(0, 2);
}

function isValidCoord(c: LatLng): boolean {
  return (
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    !(c.latitude === 0 && c.longitude === 0)
  );
}

/**
 * Menor desvio (em km) para encaixar a sugestão na sequência atual:
 * hospedagem → lugares → hospedagem. Usa distância em linha reta.
 */
function bestDetourKm(suggestion: LatLng, trip: Trip): number | null {
  const points: LatLng[] = [];
  const accommodation: LatLng = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };
  if (isValidCoord(accommodation)) points.push(accommodation);
  for (const p of trip.places) {
    if (isValidCoord(p)) points.push({ latitude: p.latitude, longitude: p.longitude });
  }
  if (points.length === 0) return null;
  if (points.length === 1) {
    return haversineKm(points[0]!, suggestion) * 2;
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const detour =
      haversineKm(a, suggestion) + haversineKm(suggestion, b) - haversineKm(a, b);
    if (detour < best) best = detour;
  }
  return Math.max(0, best);
}

function impactLabel(suggestion: LatLng, trip: Trip): string | null {
  const detourKm = bestDetourKm(suggestion, trip);
  if (detourKm === null) return null;
  if (detourKm < 0.4) return "Fica no caminho";
  const minutes = Math.round((detourKm / MODE_SPEED_KMH[trip.transportMode]) * 60);
  if (minutes < 1) return "Fica no caminho";
  return `+${minutes} min no seu roteiro`;
}

function suggestionToPlace(s: NearbySuggestion, destination: string): Place {
  return {
    id: createId(),
    externalPlaceId: s.externalPlaceId,
    name: s.name,
    category: s.category,
    address: s.address || destination,
    latitude: s.latitude,
    longitude: s.longitude,
    visitDurationMinutes: 90,
    priority: "quero_conhecer",
  };
}

export function DiscoverPlaces({ trip, onAdd, onWishlist }: Props) {
  const [forYou, setForYou] = useState<NearbySuggestion[]>([]);
  const [alsoLike, setAlsoLike] = useState<NearbySuggestion[]>([]);
  const [loadingForYou, setLoadingForYou] = useState(false);
  const [loadingAlso, setLoadingAlso] = useState(false);
  const [errorForYou, setErrorForYou] = useState<string | null>(null);
  const [errorAlso, setErrorAlso] = useState<string | null>(null);
  const abortForYou = useRef<AbortController | null>(null);
  const abortAlso = useRef<AbortController | null>(null);

  const accommodation: LatLng = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };
  const hasAccommodation = isValidCoord(accommodation);
  const categories = useMemo(() => categoriesForStyles(trip.tripStyles), [trip.tripStyles]);

  const excluded = useMemo(() => {
    const set = new Set<string>();
    for (const p of [...trip.places, ...(trip.wishlist ?? [])]) {
      if (p.externalPlaceId) set.add(p.externalPlaceId);
      set.add(`${p.name.toLowerCase()}|${p.latitude.toFixed(4)}`);
    }
    return set;
  }, [trip.places, trip.wishlist]);

  const notExcluded = (s: NearbySuggestion) =>
    !excluded.has(s.externalPlaceId) &&
    !excluded.has(`${s.name.toLowerCase()}|${s.latitude.toFixed(4)}`);

  // "Sugestões para você": carrega uma vez quando a hospedagem é confirmada.
  async function loadForYou() {
    if (!hasAccommodation) return;
    abortForYou.current?.abort();
    const controller = new AbortController();
    abortForYou.current = controller;
    setLoadingForYou(true);
    setErrorForYou(null);
    try {
      const merged: NearbySuggestion[] = [];
      const seen = new Set<string>();
      for (const category of categories) {
        const found = await fetchNearbyPlaces([accommodation], category, 1500, controller.signal);
        if (controller.signal.aborted) return;
        for (const item of found) {
          if (seen.has(item.externalPlaceId)) continue;
          seen.add(item.externalPlaceId);
          merged.push(item);
        }
      }
      merged.sort((a, b) => a.distanceKm - b.distanceKm);
      setForYou(merged.slice(0, 8));
      if (merged.length === 0)
        setErrorForYou("Não encontramos sugestões próximas à sua hospedagem.");
    } catch {
      if (controller.signal.aborted) return;
      setForYou([]);
      setErrorForYou(
        "Não foi possível carregar sugestões agora. Você ainda pode buscar um lugar pelo nome.",
      );
    } finally {
      if (!controller.signal.aborted) setLoadingForYou(false);
    }
  }

  // "Talvez você também goste": recarrega quando os lugares do roteiro mudam.
  async function loadAlsoLike() {
    const references = trip.places
      .filter(isValidCoord)
      .slice(0, 2)
      .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
    if (references.length === 0) {
      setAlsoLike([]);
      return;
    }
    abortAlso.current?.abort();
    const controller = new AbortController();
    abortAlso.current = controller;
    setLoadingAlso(true);
    setErrorAlso(null);
    try {
      const found = await fetchNearbyPlaces(references, categories[0]!, 1500, controller.signal);
      if (controller.signal.aborted) return;
      setAlsoLike(found.filter(notExcluded).slice(0, 6));
    } catch {
      if (controller.signal.aborted) return;
      setAlsoLike([]);
      setErrorAlso("Não foi possível carregar sugestões agora.");
    } finally {
      if (!controller.signal.aborted) setLoadingAlso(false);
    }
  }

  const forYouKey = hasAccommodation
    ? `${accommodation.latitude.toFixed(3)}|${accommodation.longitude.toFixed(3)}|${categories.join(",")}`
    : null;
  useEffect(() => {
    if (forYouKey) void loadForYou();
    return () => abortForYou.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forYouKey]);

  const alsoKey = trip.places
    .filter(isValidCoord)
    .slice(0, 2)
    .map((p) => `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`)
    .join("|");
  useEffect(() => {
    void loadAlsoLike();
    return () => abortAlso.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alsoKey]);

  function handleAdd(s: NearbySuggestion) {
    const result = onAdd(suggestionToPlace(s, trip.destination));
    if (result !== false) {
      toast.success(`${s.name} adicionado ao roteiro.`);
      setForYou((prev) => prev.filter((item) => item.externalPlaceId !== s.externalPlaceId));
      setAlsoLike((prev) => prev.filter((item) => item.externalPlaceId !== s.externalPlaceId));
    }
  }

  function handleWishlist(s: NearbySuggestion) {
    const result = onWishlist(suggestionToPlace(s, trip.destination));
    if (result !== false) {
      toast.success(`${s.name} salvo em "Quero conhecer".`);
      setForYou((prev) => prev.filter((item) => item.externalPlaceId !== s.externalPlaceId));
      setAlsoLike((prev) => prev.filter((item) => item.externalPlaceId !== s.externalPlaceId));
    }
  }

  function renderCard(s: NearbySuggestion, showImpact: boolean) {
    const impact = showImpact ? impactLabel(s, trip) : null;
    return (
      <div
        key={s.externalPlaceId}
        className="flex flex-col gap-2 rounded-xl border border-border p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{s.name}</span>
          <Badge variant="secondary">{s.categoryLabel}</Badge>
          {impact ? <Badge variant="outline">{impact}</Badge> : null}
        </div>
        {s.address ? (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {s.address}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Aproximadamente {s.distanceKm.toFixed(1)} km de distância
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleAdd(s)}>
            <Plus className="size-4" aria-hidden="true" />
            Adicionar ao roteiro
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleWishlist(s)}>
            <BookmarkPlus className="size-4" aria-hidden="true" />
            Quero conhecer
          </Button>
        </div>
      </div>
    );
  }

  if (!hasAccommodation && trip.places.length === 0) return null;

  const visibleForYou = forYou.filter(notExcluded);
  const visibleAlso = alsoLike.filter(notExcluded);

  return (
    <div className="space-y-6">
      {hasAccommodation ? (
        <section className="space-y-3" aria-label="Sugestões para você">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">Sugestões para você</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Lugares reais próximos à sua hospedagem
            {trip.destination ? ` em ${trip.destination}` : ""}, escolhidos pelo seu estilo de
            viagem.
          </p>
          {loadingForYou ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : errorForYou ? (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm text-muted-foreground">{errorForYou}</p>
              <Button size="sm" variant="outline" onClick={() => void loadForYou()}>
                Tentar novamente
              </Button>
            </div>
          ) : visibleForYou.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">{visibleForYou.map((s) => renderCard(s, false))}</div>
          ) : null}
        </section>
      ) : null}

      {trip.places.length > 0 ? (
        <section className="space-y-3" aria-label="Talvez você também goste">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">Talvez você também goste</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Perto dos lugares que você já escolheu — com o impacto estimado no seu deslocamento.
          </p>
          {loadingAlso ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : errorAlso ? (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm text-muted-foreground">{errorAlso}</p>
              <Button size="sm" variant="outline" onClick={() => void loadAlsoLike()}>
                Tentar novamente
              </Button>
            </div>
          ) : visibleAlso.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">{visibleAlso.map((s) => renderCard(s, true))}</div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma outra sugestão próxima por enquanto.
            </p>
          )}
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        As sugestões são fornecidas pelo OpenStreetMap. Categorias nesta busca:{" "}
        {categories.map((c) => NEARBY_CATEGORY_LABELS[c]).join(", ")}.
      </p>
    </div>
  );
}
