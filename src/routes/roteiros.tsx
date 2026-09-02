import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { isAfter, parseISO } from "date-fns";
import { MapPinned, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useTrips } from "@/hooks/useTrips";
import { tripStorage } from "@/services/storage";
import type { Trip } from "@/types/trip";

export const Route = createFileRoute("/roteiros")({
  head: () => ({
    meta: [
      { title: "Meus roteiros — Routeasy" },
      {
        name: "description",
        content: "Veja, edite, duplique e compartilhe os roteiros de viagem salvos no seu navegador.",
      },
      { property: "og:title", content: "Meus roteiros — Routeasy" },
      { property: "og:description", content: "Seus roteiros de viagem organizados dia a dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { trips, loading, refresh } = useTrips();
  const [toDelete, setToDelete] = useState<Trip | null>(null);

  const now = new Date();
  const upcoming = trips
    .filter((t) => isAfter(parseISO(t.endDate), now))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nextTrip = upcoming[0];
  const others = trips.filter((t) => t.id !== nextTrip?.id);

  function handleDuplicate(trip: Trip) {
    tripStorage.duplicate(trip.id);
    refresh();
    toast.success("Roteiro duplicado.");
  }

  function confirmDelete() {
    if (!toDelete) return;
    tripStorage.remove(toDelete.id);
    setToDelete(null);
    refresh();
    toast.success("Roteiro excluído.");
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus roteiros</h1>
            <p className="text-muted-foreground">
              Salvos localmente no seu navegador, sem cadastro nem login.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/criar">
              <Plus className="size-4" aria-hidden="true" />
              Criar novo roteiro
            </Link>
          </Button>
        </div>

        {loading ? (
          <LoadingState rows={2} label="Carregando seus roteiros" />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Você ainda não tem roteiros"
            description="Crie seu primeiro roteiro em poucos minutos: adicione os lugares, informe seus horários e receba o itinerário organizado por dia."
            action={
              <Button asChild>
                <Link to="/criar">Criar meu primeiro roteiro</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {nextTrip ? (
              <section aria-labelledby="proxima-viagem" className="space-y-3">
                <h2 id="proxima-viagem" className="text-xl font-semibold">
                  Próxima viagem
                </h2>
                <TripCard trip={nextTrip} onDuplicate={handleDuplicate} onDelete={setToDelete} />
              </section>
            ) : null}

            <Separator />

            <section aria-labelledby="roteiros-salvos" className="space-y-3">
              <h2 id="roteiros-salvos" className="text-xl font-semibold">
                Roteiros salvos
              </h2>
              {others.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum outro roteiro salvo por enquanto.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {others.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onDuplicate={handleDuplicate}
                      onDelete={setToDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e o roteiro será removido deste navegador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir roteiro</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
