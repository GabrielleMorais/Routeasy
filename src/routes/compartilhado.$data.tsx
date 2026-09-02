import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { EmptyState } from "@/components/EmptyState";
import { ItineraryTimeline } from "@/components/ItineraryTimeline";
import { RouteMap } from "@/components/RouteMap";
import { RouteSummary } from "@/components/RouteSummary";
import { UnscheduledPlaces } from "@/components/UnscheduledPlaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { decodeTrip } from "@/services/storage";

export const Route = createFileRoute("/compartilhado/$data")({
  head: () => ({
    meta: [
      { title: "Roteiro compartilhado — Routeasy" },
      {
        name: "description",
        content: "Visualização somente leitura de um roteiro de viagem compartilhado no Routeasy.",
      },
      { property: "og:title", content: "Roteiro compartilhado — Routeasy" },
      { property: "og:description", content: "Veja o itinerário completo, dia a dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedTrip,
});

function SharedTrip() {
  const { data } = Route.useParams();
  const trip = decodeTrip(data);

  if (!trip) {
    return (
      <div className="min-h-screen">
        <AppNavbar />
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            icon={AlertCircle}
            title="Link inválido ou incompleto"
            description="Não foi possível abrir este roteiro compartilhado. Peça um novo link para quem enviou."
            action={
              <Button asChild>
                <Link to="/">Ir para a página inicial</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  const days = trip.itinerary ?? [];

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <Badge variant="secondary">Somente leitura</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{trip.title}</h1>
          <p className="text-muted-foreground">
            {trip.destination} ·{" "}
            {format(parseISO(trip.startDate), "dd 'de' MMMM", { locale: ptBR })} a{" "}
            {format(parseISO(trip.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </header>

        {days.length > 0 ? (
          <>
            <RouteSummary days={days} />
            <Tabs defaultValue="1">
              <TabsList className="flex-wrap">
                {days.map((day) => (
                  <TabsTrigger key={day.id} value={String(day.dayNumber)}>
                    Dia {day.dayNumber}
                  </TabsTrigger>
                ))}
              </TabsList>
              {days.map((day) => (
                <TabsContent
                  key={day.id}
                  value={String(day.dayNumber)}
                  className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1fr)_380px]"
                >
                  <ItineraryTimeline day={day} readOnly />
                  <aside>
                    <div className="sticky top-20">
                      <RouteMap trip={trip} days={days} activeDayNumber={day.dayNumber} />
                    </div>
                  </aside>
                </TabsContent>
              ))}
            </Tabs>
            <UnscheduledPlaces places={trip.unscheduled ?? []} />
          </>
        ) : (
          <p className="text-muted-foreground">Este roteiro ainda não possui itinerário gerado.</p>
        )}

        <Button asChild>
          <Link to="/criar">Criar meu próprio roteiro</Link>
        </Button>
      </main>
    </div>
  );
}
