/**
 * Prévia da otimização da ordem dos lugares.
 * Toda a lógica de cálculo vive em `@/services/route-optimizer`; aqui só
 * apresentamos a comparação entre a ordem atual e a recomendada.
 */
import { useState } from "react";
import { ArrowRight, Loader2, Route as RouteIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMinutes } from "@/lib/labels";
import { buildOrderComparison, type OrderComparison } from "@/services/route-optimizer";
import type { Place, Trip } from "@/types/trip";

interface Props {
  trip: Trip;
  onApply: (places: Place[]) => void;
  variant?: "default" | "outline";
}

export function OptimizeOrderDialog({ trip, onApply, variant = "outline" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Calculando a melhor ordem das visitas...");
  const [comparison, setComparison] = useState<OrderComparison | null>(null);

  async function run() {
    if (loading) return;
    setLoading(true);
    setComparison(null);
    setStatus("Calculando a melhor ordem das visitas...");
    try {
      setStatus("Comparando trajetos...");
      const result = await buildOrderComparison(trip);
      setComparison(result);
      setStatus(result.improved ? "Rota recomendada encontrada" : "A ordem atual já é uma boa opção");
      if (!result.usedRealRoutes) {
        toast.warning(
          "Não foi possível consultar as rotas reais. A organização foi feita por proximidade geográfica.",
        );
      }
    } catch {
      setStatus("Não foi possível otimizar a rota agora");
      toast.error("Não foi possível otimizar a rota agora.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void run();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} disabled={trip.places.length < 2}>
          <RouteIcon className="size-4" aria-hidden="true" />
          Otimizar ordem dos lugares
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Otimizar ordem dos lugares</DialogTitle>
          <DialogDescription>
            Rota recomendada com base nas informações disponíveis (coordenadas reais, rotas do OSRM,
            horários e bloqueios).
          </DialogDescription>
        </DialogHeader>

        {loading || !comparison ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {status}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-semibold">Ordem atual</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {comparison.currentOrder.map((name, i) => (
                    <li key={`${name}-${i}`}>{name}</li>
                  ))}
                </ol>
                <p className="mt-3 text-sm">
                  {comparison.currentDistance} km · {formatMinutes(comparison.currentMinutes)}
                </p>
              </div>
              <div className="rounded-xl border border-primary/40 bg-accent/40 p-3">
                <p className="mb-2 text-sm font-semibold">Ordem recomendada</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {comparison.recommendedOrder.map((name, i) => (
                    <li key={`${name}-${i}`}>{name}</li>
                  ))}
                </ol>
                <p className="mt-3 text-sm">
                  {comparison.recommendedDistance} km ·{" "}
                  {formatMinutes(comparison.recommendedMinutes)}
                </p>
              </div>
            </div>

            <Alert>
              <Sparkles className="size-4" aria-hidden="true" />
              <AlertTitle>
                {comparison.improved
                  ? "Encontramos uma ordem mais eficiente para reduzir deslocamentos."
                  : "A ordem atual já é uma boa opção"}
              </AlertTitle>
              <AlertDescription>
                {comparison.improved
                  ? `Esta organização pode economizar aproximadamente ${formatMinutes(
                      Math.max(0, comparison.savedMinutes),
                    )} e ${Math.max(0, comparison.savedDistance).toFixed(1)} quilômetros de deslocamento.`
                  : "A ordem atual já é uma boa opção com base nas informações disponíveis."}
                {comparison.usedRealRoutes
                  ? " Distâncias e durações vindas das rotas reais do OSRM."
                  : " Não foi possível consultar as rotas reais. A organização foi feita por proximidade geográfica."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Manter ordem atual
          </Button>
          <Button
            disabled={loading || !comparison}
            onClick={() => {
              if (!comparison) return;
              onApply(comparison.recommendedPlaces);
              setOpen(false);
            }}
          >
            Aplicar rota recomendada
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
