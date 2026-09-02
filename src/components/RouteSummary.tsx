import { Clock, Footprints, Route as RouteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/labels";
import type { ItineraryDay } from "@/types/trip";

interface Props {
  days: ItineraryDay[];
  /** Texto que deixa explícito a que período os totais se referem. */
  caption?: string;
  /** Versão compacta em uma linha, usada dentro de cada aba diária. */
  compact?: boolean;
}

function totals(days: ItineraryDay[]) {
  return {
    distance: days.reduce((sum, d) => sum + d.totalDistance, 0),
    travel: days.reduce((sum, d) => sum + d.totalTravelMinutes, 0),
    visits: days.reduce(
      (sum, d) => sum + d.items.filter((i) => i.itemType === "visita").length,
      0,
    ),
  };
}

export function RouteSummary({ days, caption, compact = false }: Props) {
  const { distance, travel, visits } = totals(days);

  const stats = [
    { icon: RouteIcon, label: "Distância estimada", value: `${distance.toFixed(1)} km` },
    { icon: Clock, label: "Tempo em deslocamento", value: formatMinutes(travel) },
    { icon: Footprints, label: "Visitas planejadas", value: String(visits) },
  ];

  if (compact) {
    return (
      <p className="text-sm text-muted-foreground">
        {caption ? <span className="font-medium text-foreground">{caption} </span> : null}
        {distance.toFixed(1)} km · {formatMinutes(travel)} em deslocamento ·{" "}
        {visits} {visits === 1 ? "visita" : "visitas"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {caption ?? `Totais da viagem inteira (${days.length} ${days.length === 1 ? "dia" : "dias"})`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">{label}</span>
                <span className="block text-lg font-semibold">{value}</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
