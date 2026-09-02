import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchRouteGeometry,
  googleMapsDirectionsUrl,
  usesOpenStreetMap,
  type LatLng,
} from "@/services/maps";
import { formatMinutes } from "@/lib/labels";
import type { MapRoute, MapStop } from "@/components/LeafletMap";
import type { ItineraryDay, Trip } from "@/types/trip";

const LeafletMap = lazy(() => import("@/components/LeafletMap"));

const DAY_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface Props {
  trip: Trip;
  days: ItineraryDay[];
  activeDayNumber?: number | "todos";
}

/**
 * Mapa do roteiro com OpenStreetMap (Leaflet) e rotas reais do OSRM.
 * As props permanecem estáveis caso o provedor seja trocado no futuro.
 */
export function RouteMap({ trip, days, activeDayNumber = "todos" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [realTotals, setRealTotals] = useState<Record<string, { km: number; min: number }>>({});

  useEffect(() => setMounted(true), []);

  const visibleDays = useMemo(
    () => (activeDayNumber === "todos" ? days : days.filter((d) => d.dayNumber === activeDayNumber)),
    [days, activeDayNumber],
  );

  const perDay = useMemo(() => {
    const byPlace = new Map(trip.places.map((p) => [p.id, p]));
    return visibleDays.map((day) => ({
      day,
      stops: day.items
        .filter((item) => item.placeId && byPlace.has(item.placeId))
        .map((item) => ({ item, place: byPlace.get(item.placeId!)! })),
    }));
  }, [visibleDays, trip.places]);

  const accommodation: LatLng = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };

  const stops: MapStop[] = useMemo(
    () =>
      perDay.flatMap(({ day, stops: dayStops }) =>
        dayStops.map((stop, index) => ({
          id: `${day.id}-${stop.item.id}`,
          order: index + 1,
          name: stop.place.name,
          address: stop.place.address,
          time: `Dia ${day.dayNumber} · ${stop.item.startTime} às ${stop.item.endTime}`,
          latitude: stop.place.latitude,
          longitude: stop.place.longitude,
          color: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length]!,
        })),
      ),
    [perDay],
  );

  // Traçado real das rotas (OSRM), com fallback em linha reta.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result: MapRoute[] = [];
      const totals: Record<string, { km: number; min: number }> = {};
      for (const { day, stops: dayStops } of perDay) {
        const points: LatLng[] = [
          accommodation,
          ...dayStops.map((s) => ({ latitude: s.place.latitude, longitude: s.place.longitude })),
          ...(trip.preferences.returnToAccommodation ? [accommodation] : []),
        ];
        const geometry = await fetchRouteGeometry(points, trip.transportMode);
        if (!geometry) continue;
        result.push({
          id: day.id,
          color: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length]!,
          dashed: geometry.isMock,
          coordinates: geometry.coordinates,
        });
        if (!geometry.isMock) {
          totals[day.id] = { km: geometry.distanceKm, min: geometry.durationMinutes };
        }
      }
      if (!cancelled) {
        setRoutes(result);
        setRealTotals(totals);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perDay, trip.transportMode, trip.preferences.returnToAccommodation]);

  return (
    <div className="space-y-3">
      {!usesOpenStreetMap ? (
        <Alert>
          <AlertTitle>Mapa em modo de demonstração</AlertTitle>
          <AlertDescription>
            Sem credenciais do provedor de mapas, distâncias e tempos são estimativas.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <div className="relative isolate z-0 aspect-4/3 w-full overflow-hidden bg-accent/30">
            {mounted ? (
              <Suspense fallback={<Skeleton className="size-full" />}>
                <LeafletMap
                  accommodation={{ ...accommodation, address: trip.accommodationAddress }}
                  stops={stops}
                  routes={routes}
                />
              </Suspense>
            ) : (
              <Skeleton className="size-full" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {visibleDays.map((day) => {
          const real = realTotals[day.id];
          return (
            <Badge key={day.id} variant="outline" className="gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length] }}
                aria-hidden="true"
              />
              Dia {day.dayNumber} · {real ? real.km : day.totalDistance} km ·{" "}
              {formatMinutes(real ? real.min : day.totalTravelMinutes)}
              {real ? " (rota real)" : ""}
            </Badge>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Mapa © colaboradores do OpenStreetMap · rotas calculadas pelo OSRM.
      </p>

      <Button variant="outline" className="w-full" asChild>
        <a
          href={googleMapsDirectionsUrl(
            [
              accommodation,
              ...perDay.flatMap((d) => d.stops.map((s) => s.place)),
            ],
            trip.transportMode,
          )}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Abrir no Google Maps
        </a>
      </Button>
    </div>
  );
}
