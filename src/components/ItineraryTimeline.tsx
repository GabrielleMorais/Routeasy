import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bike,
  Bus,
  Car,
  Coffee,
  Footprints,
  Home,
  Lock,
  MapPin,
  Trash2,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { categoryLabels, formatMinutes, transportLabels } from "@/lib/labels";
import type { ItineraryDay, ItineraryItem, TransportMode } from "@/types/trip";

const transportIcons: Record<TransportMode, typeof Car> = {
  carro: Car,
  transporte_publico: Bus,
  bicicleta: Bike,
  a_pe: Footprints,
};

const typeStyles: Record<ItineraryItem["itemType"], { color: string; label: string }> = {
  visita: { color: "var(--visit)", label: "Visita" },
  deslocamento: { color: "var(--travel)", label: "Deslocamento" },
  refeicao: { color: "var(--meal)", label: "Refeição" },
  partida: { color: "var(--free)", label: "Início do dia" },
  retorno: { color: "var(--free)", label: "Retorno" },
  livre: { color: "var(--free)", label: "Tempo livre" },
};

interface Props {
  day: ItineraryDay;
  readOnly?: boolean;
  /** Lugares da viagem: usados só para gerar os links de navegação externa. */
  places?: Place[];
  /** Ponto de partida (hospedagem), origem do primeiro trecho. */
  origin?: LatLng | undefined;
  onMove?: (item: ItineraryItem, direction: -1 | 1) => void;
  onRemove?: (item: ItineraryItem) => void;
  onToggleLock?: (item: ItineraryItem) => void;
}

export function ItineraryTimeline({
  day,
  readOnly,
  places,
  origin,
  onMove,
  onRemove,
  onToggleLock,
}: Props) {
  const byId = new Map((places ?? []).map((p) => [p.id, p]));

  function legPoints(index: number): { from: LatLng | undefined; to: Place | undefined } {
    let to: Place | undefined;
    for (let i = index + 1; i < day.items.length; i += 1) {
      const candidate = day.items[i]!;
      if (candidate.placeId) {
        to = byId.get(candidate.placeId);
        break;
      }
    }
    let from: LatLng | undefined = origin;
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = day.items[i]!;
      if (candidate.placeId) {
        const place = byId.get(candidate.placeId);
        if (place) from = { latitude: place.latitude, longitude: place.longitude };
        break;
      }
    }
    return { from, to };
  }

  return (
    <ol className="space-y-3">
      {day.items.map((item, index) => {
        const style = typeStyles[item.itemType];
        const TransportIcon = item.transportMode ? transportIcons[item.transportMode] : MapPin;
        const isStop = item.itemType !== "deslocamento";

        return (
          <li key={item.id}>
            <Card
              className="border-l-4 py-0"
              style={{ borderLeftColor: style.color }}
            >
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-28 shrink-0 font-mono text-sm font-semibold tabular-nums">
                  {item.startTime}
                  {item.endTime !== item.startTime ? ` – ${item.endTime}` : ""}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.itemType === "partida" || item.itemType === "retorno" ? (
                      <Home className="size-4 text-muted-foreground" aria-hidden="true" />
                    ) : item.itemType === "refeicao" ? (
                      <Utensils className="size-4 text-muted-foreground" aria-hidden="true" />
                    ) : item.itemType === "deslocamento" ? (
                      <TransportIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Coffee className="size-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="outline">{style.label}</Badge>
                    {item.category ? (
                      <Badge variant="secondary">{categoryLabels[item.category]}</Badge>
                    ) : null}
                    {item.isLocked ? (
                      <Badge className="gap-1" variant="secondary">
                        <Lock className="size-3" aria-hidden="true" /> Fixado
                      </Badge>
                    ) : null}
                  </div>
                  {item.itemType === "deslocamento" && item.travelMinutes ? (
                    <p className="text-sm text-muted-foreground">
                      {formatMinutes(item.travelMinutes)} · {item.travelDistance} km ·{" "}
                      {item.transportMode ? transportLabels[item.transportMode] : ""}
                    </p>
                  ) : null}
                  {item.address ? (
                    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {item.address}
                    </p>
                  ) : null}
                  {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
                  {item.warning ? (
                    <p className="flex items-center gap-1.5 rounded-lg bg-alert/15 px-2 py-1 text-sm font-medium text-foreground">
                      <AlertTriangle className="size-4 text-alert" aria-hidden="true" />
                      {item.warning}
                    </p>
                  ) : null}
                  {item.status !== "pendente" ? (
                    <Badge variant={item.status === "concluido" ? "default" : "outline"}>
                      {item.status === "concluido" ? "Concluído" : "Pulado"}
                    </Badge>
                  ) : null}
                </div>
                {!readOnly && isStop && item.placeId ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${item.title} para cima`}
                      onClick={() => onMove?.(item, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${item.title} para baixo`}
                      onClick={() => onMove?.(item, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${item.isLocked ? "Desbloquear" : "Bloquear"} ${item.title}`}
                      onClick={() => onToggleLock?.(item)}
                    >
                      <Lock className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${item.title} do roteiro`}
                      onClick={() => onRemove?.(item)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </li>
        );
      })}
      <Separator />
    </ol>
  );
}
