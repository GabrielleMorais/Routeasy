import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { googleMapsDirectionsUrl, isMapsConfigured } from "@/services/maps";
import { formatMinutes } from "@/lib/labels";
import type { ItineraryDay, Trip } from "@/types/trip";

const DAY_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface Props {
  trip: Trip;
  days: ItineraryDay[];
  activeDayNumber?: number | "todos";
}

/**
 * Mapa esquemático baseado nas coordenadas dos locais.
 * Com a API de mapas configurada, este componente será substituído pelo mapa
 * interativo real (Google Maps ou Mapbox) mantendo as mesmas props.
 */
export function RouteMap({ trip, days, activeDayNumber = "todos" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const visibleDays = useMemo(
    () => (activeDayNumber === "todos" ? days : days.filter((d) => d.dayNumber === activeDayNumber)),
    [days, activeDayNumber],
  );

  const points = useMemo(() => {
    const byPlace = new Map(trip.places.map((p) => [p.id, p]));
    return visibleDays.map((day) => ({
      day,
      stops: day.items
        .filter((item) => item.placeId && byPlace.has(item.placeId))
        .map((item) => ({ item, place: byPlace.get(item.placeId!)! })),
    }));
  }, [visibleDays, trip.places]);

  const allCoords = [
    { latitude: trip.accommodationLatitude, longitude: trip.accommodationLongitude },
    ...points.flatMap((d) => d.stops.map((s) => s.place)),
  ];

  const bounds = useMemo(() => {
    const lats = allCoords.map((c) => c.latitude);
    const lngs = allCoords.map((c) => c.longitude);
    const pad = 0.006;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [allCoords]);

  const project = (c: { latitude: number; longitude: number }) => ({
    x: ((c.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100,
    y: (1 - (c.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 100,
  });

  const accommodation = project({
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  });

  return (
    <div className="space-y-3">
      {!isMapsConfigured ? (
        <Alert>
          <AlertTitle>Mapa em modo de demonstração</AlertTitle>
          <AlertDescription>
            Sem credenciais da API de mapas, exibimos um mapa esquemático com as posições reais dos
            locais cadastrados. Distâncias e tempos são estimativas.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <div className="relative aspect-4/3 w-full bg-[linear-gradient(0deg,var(--muted)_1px,transparent_1px),linear-gradient(90deg,var(--muted)_1px,transparent_1px)] bg-[length:32px_32px] bg-accent/30">
            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {points.map(({ day, stops }, dayIndex) => {
                const coords = [
                  accommodation,
                  ...stops.map((s) => project(s.place)),
                  ...(trip.preferences.returnToAccommodation ? [accommodation] : []),
                ];
                return (
                  <polyline
                    key={day.id}
                    points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
                    fill="none"
                    stroke={DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length]}
                    strokeWidth={0.8}
                    strokeDasharray={dayIndex % 2 ? "2 1.5" : undefined}
                    strokeLinejoin="round"
                  />
                );
              })}
            </svg>

            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${accommodation.x}%`, top: `${accommodation.y}%` }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-soft)]">
                <MapPin className="size-4" aria-hidden="true" />
                <span className="sr-only">Hospedagem: {trip.accommodationAddress}</span>
              </span>
            </div>

            {points.map(({ day, stops }) =>
              stops.map((stop, index) => {
                const pos = project(stop.place);
                const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
                const key = `${day.id}-${stop.item.id}`;
                return (
                  <Popover
                    key={key}
                    open={selected === key}
                    onOpenChange={(open) => setSelected(open ? key : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background text-xs font-bold text-background shadow-[var(--shadow-soft)] transition-transform hover:scale-110"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, backgroundColor: color }}
                        aria-label={`Dia ${day.dayNumber}, parada ${index + 1}: ${stop.place.name}`}
                      >
                        {index + 1}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-2">
                      <p className="font-semibold">{stop.place.name}</p>
                      <p className="text-sm text-muted-foreground">{stop.place.address}</p>
                      <p className="text-sm">
                        Dia {day.dayNumber} · {stop.item.startTime} às {stop.item.endTime}
                      </p>
                    </PopoverContent>
                  </Popover>
                );
              }),
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {visibleDays.map((day) => (
          <Badge key={day.id} variant="outline" className="gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length] }}
              aria-hidden="true"
            />
            Dia {day.dayNumber} · {day.totalDistance} km ·{" "}
            {formatMinutes(day.totalTravelMinutes)}
          </Badge>
        ))}
      </div>

      <Button variant="outline" className="w-full" asChild>
        <a
          href={googleMapsDirectionsUrl(
            [
              { latitude: trip.accommodationLatitude, longitude: trip.accommodationLongitude },
              ...points.flatMap((d) => d.stops.map((s) => s.place)),
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
