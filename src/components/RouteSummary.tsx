import { Clock, Footprints, Route as RouteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/labels";
import type { ItineraryDay } from "@/types/trip";

export function RouteSummary({ days }: { days: ItineraryDay[] }) {
  const distance = days.reduce((sum, d) => sum + d.totalDistance, 0);
  const travel = days.reduce((sum, d) => sum + d.totalTravelMinutes, 0);
  const visits = days.reduce(
    (sum, d) => sum + d.items.filter((i) => i.itemType === "visita").length,
    0,
  );

  const stats = [
    { icon: RouteIcon, label: "Distância estimada", value: `${distance.toFixed(1)} km` },
    { icon: Clock, label: "Tempo em deslocamento", value: formatMinutes(travel) },
    { icon: Footprints, label: "Visitas planejadas", value: String(visits) },
  ];

  return (
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
  );
}
