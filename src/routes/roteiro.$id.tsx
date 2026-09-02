import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPinned, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { ConflictAlert } from "@/components/ConflictAlert";
import { EmptyState } from "@/components/EmptyState";
import { ItineraryTimeline } from "@/components/ItineraryTimeline";
import { LoadingState } from "@/components/LoadingState";
import { MobileTravelMode } from "@/components/MobileTravelMode";
import { RouteMap } from "@/components/RouteMap";
import { RouteSummary } from "@/components/RouteSummary";
import { ShareTripDialog } from "@/components/ShareTripDialog";
import { UnscheduledPlaces } from "@/components/UnscheduledPlaces";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTrip } from "@/hooks/useTrips";
import { optimizeTrip, recalculateDay } from "@/services/optimizer";
import { warmupRoutes } from "@/services/maps";
import type { ItineraryDay, ItineraryItem, Trip } from "@/types/trip";

export const Route = createFileRoute("/roteiro/$id")({
  head: () => ({
    meta: [
      { title: "Seu roteiro dia a dia — Routeasy" },
      {
        name: "description",
        content:
          "Veja o itinerário organizado por dia, com horários, deslocamentos, refeições e mapa das paradas.",
      },
      { property: "og:title", content: "Seu roteiro dia a dia — Routeasy" },
      {
        property: "og:description",
        content: "Itinerário com horários, deslocamentos e mapa das paradas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ItineraryPage,
});

function ItineraryPage() {
  const { id } = Route.useParams();
  const { trip, loading, update } = useTrip(id);
  const [history, setHistory] = useState<Trip[]>([]);
  const [activeDay, setActiveDay] = useState("1");

  const days = useMemo(() => trip?.itinerary ?? [], [trip]);
  const currentDay = days.find((d) => String(d.dayNumber) === activeDay) ?? days[0];

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          <LoadingState rows={4} label="Carregando roteiro" />
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            icon={MapPinned}
            title="Roteiro não encontrado"
            description="Este roteiro não existe neste navegador. Ele pode ter sido excluído ou criado em outro dispositivo."
            action={
              <Button asChild>
                <Link to="/roteiros">Ver meus roteiros</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  function commit(next: Trip, message?: string) {
    setHistory((prev) => [...prev.slice(-9), trip!]);
    update(next);
    if (message) toast.success(message);
  }

  function applyDay(nextDay: ItineraryDay) {
    const recalculated = recalculateDay(trip!, nextDay);
    commit({
      ...trip!,
      itinerary: days.map((d) => (d.id === nextDay.id ? recalculated : d)),
    });
  }

  function moveItem(day: ItineraryDay, item: ItineraryItem, direction: -1 | 1) {
    const stops = day.items.filter((i) => i.itemType !== "deslocamento" && i.itemType !== "partida");
    const index = stops.findIndex((i) => i.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= stops.length) return;
    if (stops[index]!.isLocked || stops[target]!.isLocked) {
      toast.error("Esta atividade está bloqueada para alterações.");
      return;
    }
    const reordered = [...stops];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved!);
    applyDay({ ...day, items: reordered });
  }

  function removeItem(day: ItineraryDay, item: ItineraryItem) {
    applyDay({ ...day, items: day.items.filter((i) => i.id !== item.id) });
  }

  function toggleLock(day: ItineraryDay, item: ItineraryItem) {
    applyDay({
      ...day,
      items: day.items.map((i) => (i.id === item.id ? { ...i, isLocked: !i.isLocked } : i)),
    });
  }

  function updateStatus(day: ItineraryDay, item: ItineraryItem, status: ItineraryItem["status"]) {
    commit({
      ...trip!,
      itinerary: days.map((d) =>
        d.id === day.id
          ? { ...d, items: d.items.map((i) => (i.id === item.id ? { ...i, status } : i)) }
          : d,
      ),
    });
  }

  async function reoptimize() {
    await warmupRoutes(
      [
        { latitude: trip!.accommodationLatitude, longitude: trip!.accommodationLongitude },
        ...trip!.places.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      ],
      trip!.transportMode,
    );
    const result = optimizeTrip(trip!);
    commit(
      { ...trip!, itinerary: result.days, unscheduled: result.unscheduled },
      "Roteiro otimizado novamente.",
    );
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    update(previous);
    toast.success("Última alteração desfeita.");
  }

  const timelineProps = currentDay
    ? {
        day: currentDay,
        onMove: (item: ItineraryItem, direction: -1 | 1) => moveItem(currentDay, item, direction),
        onRemove: (item: ItineraryItem) => removeItem(currentDay, item),
        onToggleLock: (item: ItineraryItem) => toggleLock(currentDay, item),
      }
    : null;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{trip.title}</h1>
            <p className="text-muted-foreground">
              {trip.destination} ·{" "}
              {format(parseISO(trip.startDate), "dd 'de' MMMM", { locale: ptBR })} a{" "}
              {format(parseISO(trip.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <Badge variant="secondary">Rota recomendada com base nas informações disponíveis</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={undo} disabled={history.length === 0}>
              <Undo2 className="size-4" aria-hidden="true" />
              Desfazer
            </Button>
            <Button variant="outline" onClick={() => void reoptimize()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Otimizar novamente
            </Button>
            <ShareTripDialog trip={trip} />
          </div>
        </header>

        {days.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Roteiro ainda não gerado"
            description="Este roteiro não possui itinerário. Gere a organização automática dos dias a partir dos lugares cadastrados."
            action={<Button onClick={() => void reoptimize()}>Gerar itinerário</Button>}
          />
        ) : (
          <>
            <RouteSummary
              days={days}
              caption={`Totais da viagem inteira (${days.length} ${days.length === 1 ? "dia" : "dias"})`}
            />

            <ConflictAlert days={days} />

            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="flex-wrap">
                {days.map((day) => (
                  <TabsTrigger key={day.id} value={String(day.dayNumber)}>
                    Dia {day.dayNumber}
                  </TabsTrigger>
                ))}
              </TabsList>

              {days.map((day) => (
                <TabsContent key={day.id} value={String(day.dayNumber)} className="pt-4">
                  <div className="space-y-1 pb-3">
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <RouteSummary days={[day]} caption={`Somente o dia ${day.dayNumber}:`} compact />
                  </div>


                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="lg:hidden">
                      <Tabs defaultValue="roteiro">
                        <TabsList className="w-full">
                          <TabsTrigger value="roteiro" className="flex-1">
                            Roteiro
                          </TabsTrigger>
                          <TabsTrigger value="mapa" className="flex-1">
                            Mapa
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="roteiro" className="space-y-4 pt-4">
                          {timelineProps && day.id === currentDay?.id ? (
                            <ItineraryTimeline {...timelineProps} />
                          ) : (
                            <ItineraryTimeline day={day} readOnly />
                          )}
                          <MobileTravelMode
                            trip={trip}
                            day={day}
                            onUpdateStatus={(item, status) => updateStatus(day, item, status)}
                          />
                        </TabsContent>
                        <TabsContent value="mapa" className="pt-4">
                          <RouteMap trip={trip} days={days} activeDayNumber={day.dayNumber} />
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="hidden space-y-4 lg:block">
                      {timelineProps && day.id === currentDay?.id ? (
                        <ItineraryTimeline {...timelineProps} />
                      ) : (
                        <ItineraryTimeline day={day} readOnly />
                      )}
                    </div>
                    <aside className="hidden lg:block">
                      <div className="sticky top-20 space-y-4">
                        <RouteMap trip={trip} days={days} activeDayNumber={day.dayNumber} />
                        <MobileTravelMode
                          trip={trip}
                          day={day}
                          onUpdateStatus={(item, status) => updateStatus(day, item, status)}
                        />
                      </div>
                    </aside>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <UnscheduledPlaces places={trip.unscheduled ?? []} />
          </>
        )}
      </main>
    </div>
  );
}
