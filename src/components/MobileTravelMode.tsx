import { Check, ExternalLink, Navigation, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { moovitDirectionsUrl, wazeNavigationUrl } from "@/services/maps";
import type { ItineraryDay, ItineraryItem, Trip } from "@/types/trip";

interface Props {
  trip: Trip;
  day: ItineraryDay;
  onUpdateStatus: (item: ItineraryItem, status: ItineraryItem["status"]) => void;
}

export function MobileTravelMode({ trip, day, onUpdateStatus }: Props) {
  const stops = day.items.filter((i) => i.itemType !== "deslocamento" && i.itemType !== "partida");
  const done = stops.filter((i) => i.status !== "pendente").length;
  const next = stops.find((i) => i.status === "pendente");
  const progress = stops.length ? Math.round((done / stops.length) * 100) : 0;
  const nextPlace = next?.placeId ? trip.places.find((p) => p.id === next.placeId) : undefined;
  const accommodation = {
    latitude: trip.accommodationLatitude,
    longitude: trip.accommodationLongitude,
  };
  const now = new Date();
  const late =
    next && `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` > next.endTime;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">
          <Navigation className="size-4" aria-hidden="true" />
          Modo durante a viagem
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dia {day.dayNumber} em andamento</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="space-y-2">
            <Progress value={progress} aria-label={`Progresso do dia: ${progress}%`} />
            <p className="text-sm text-muted-foreground">
              {done} de {stops.length} atividades concluídas ou puladas ({progress}%)
            </p>
          </div>

          {late ? (
            <Alert>
              <AlertTitle>Você pode estar atrasado</AlertTitle>
              <AlertDescription>
                O horário previsto para esta atividade já passou. Considere pular ou reduzir a
                próxima visita.
              </AlertDescription>
            </Alert>
          ) : null}

          {next ? (
            <div className="surface-card space-y-3 p-4">
              <Badge variant="secondary">Próxima atividade</Badge>
              <h3 className="text-xl font-semibold">{next.title}</h3>
              <p className="font-mono text-sm">
                {next.startTime} – {next.endTime}
              </p>
              {next.address ? <p className="text-sm text-muted-foreground">{next.address}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {nextPlace && trip.transportMode === "carro" ? (
                  <Button asChild>
                    <a
                      href={wazeNavigationUrl(nextPlace)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Ir com Waze
                    </a>
                  </Button>
                ) : null}
                {nextPlace && trip.transportMode === "transporte_publico" ? (
                  <Button asChild>
                    <a
                      href={moovitDirectionsUrl(nextPlace, accommodation, nextPlace.name)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Ver rota no Moovit
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="secondary">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      next.address ?? trip.destination,
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Como chegar
                  </a>
                </Button>
                <Button onClick={() => onUpdateStatus(next, "concluido")}>
                  <Check className="size-4" aria-hidden="true" />
                  Concluído
                </Button>
                <Button variant="outline" onClick={() => onUpdateStatus(next, "pulado")}>
                  <SkipForward className="size-4" aria-hidden="true" />
                  Pular
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTitle>Dia concluído</AlertTitle>
              <AlertDescription>Todas as atividades deste dia já foram marcadas.</AlertDescription>
            </Alert>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
