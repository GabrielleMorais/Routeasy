import { ArrowDown, ArrowUp, Clock, Lock, MapPin, Pencil, Trash2, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PriorityBadge } from "@/components/PriorityBadge";
import { categoryLabels, formatMinutes } from "@/lib/labels";
import type { Place } from "@/types/trip";

interface PlaceCardProps {
  place: Place;
  onEdit?: (place: Place) => void;
  onRemove?: (place: Place) => void;
  onMoveUp?: (place: Place) => void;
  onMoveDown?: (place: Place) => void;
  onToggleLock?: (place: Place) => void;
}

export function PlaceCard({
  place,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleLock,
}: PlaceCardProps) {

  return (
    <Card className="transition-shadow hover:shadow-[var(--shadow-lift)]">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{place.name}</h3>
            <Badge variant="outline">{categoryLabels[place.category]}</Badge>
            <PriorityBadge priority={place.priority} />
            {place.mealTag ? (
              <Badge className="gap-1 bg-coral text-coral-foreground">
                <Utensils className="size-3" aria-hidden="true" />
                {place.mealTag === "almoco" ? "Almoço" : "Jantar"}
              </Badge>
            ) : null}
          </div>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{place.address}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {formatMinutes(place.visitDurationMinutes)}
            </span>
            {place.rating ? <span>Avaliação {place.rating.toFixed(1)}</span> : null}
            {place.fixedStartTime ? <span>Horário fixo às {place.fixedStartTime}</span> : null}
          </div>
          {place.notes ? (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{place.notes}</p>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1 self-end sm:self-start">
          {onMoveUp ? (
            <Button variant="ghost" size="icon" aria-label={`Mover ${place.name} para cima`} onClick={() => onMoveUp(place)}>
              <ArrowUp className="size-4" />
            </Button>
          ) : null}
          {onMoveDown ? (
            <Button variant="ghost" size="icon" aria-label={`Mover ${place.name} para baixo`} onClick={() => onMoveDown(place)}>
              <ArrowDown className="size-4" />
            </Button>
          ) : null}
          {onEdit ? (
            <Button variant="ghost" size="icon" aria-label={`Editar ${place.name}`} onClick={() => onEdit(place)}>
              <Pencil className="size-4" />
            </Button>
          ) : null}
          {onRemove ? (
            <Button variant="ghost" size="icon" aria-label={`Excluir ${place.name}`} onClick={() => onRemove(place)}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
