/**
 * Sugestões simples de lugares próximos (OpenStreetMap / Overpass API).
 * Sem IA e sem APIs pagas: apenas nome, categoria, endereço e distância.
 */
import { useRef, useState } from "react";
import { Compass, ExternalLink, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { durationOptions, priorityLabels } from "@/lib/labels";
import {
  NEARBY_CATEGORY_LABELS,
  fetchNearbyPlaces,
  type NearbyCategory,
  type NearbySuggestion,
} from "@/services/maps";
import { createId } from "@/services/storage";
import type { Place, Priority, Trip } from "@/types/trip";

interface Props {
  trip: Trip;
  /** Retorne `false` quando o lugar for recusado (ex.: duplicado). */
  onAdd: (place: Place) => boolean | void;
}

const categories = Object.keys(NEARBY_CATEGORY_LABELS) as NearbyCategory[];

export function NearbyPlacesDialog({ trip, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NearbyCategory>("turismo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NearbySuggestion[]>([]);
  const [duration, setDuration] = useState(90);
  const [priority, setPriority] = useState<Priority>("quero_conhecer");
  const abortRef = useRef<AbortController | null>(null);

  // Referência da busca: os lugares já adicionados ao roteiro (1º e 2º),
  // e não o ponto de partida/hospedagem.
  const references = trip.places
    .filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        !(p.latitude === 0 && p.longitude === 0),
    )
    .slice(0, 2)
    .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  const hasReferences = references.length > 0;

  async function load(next: NearbyCategory) {
    // Cancela a requisição anterior (troca de categoria ou clique repetido).
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCategory(next);
    setLoading(true);
    setError(null);
    try {
      // Uma única consulta cobre o 1º e o 2º lugar do roteiro.
      const found = await fetchNearbyPlaces(references, next, 1500, controller.signal);
      if (controller.signal.aborted) return;
      setResults(found);
      if (found.length === 0)
        setError("Não encontramos lugares desta categoria próximos ao seu roteiro.");
    } catch {
      if (controller.signal.aborted) return;
      setResults([]);
      setError(
        "Não foi possível carregar sugestões agora. Você ainda pode buscar um lugar pelo nome.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) abortRef.current?.abort();
    // Busca somente ao abrir o modal (nunca automaticamente ao entrar na etapa).
    if (next && results.length === 0 && hasReferences) void load(category);
  }


  const added = new Set(
    trip.places.map((p) => p.externalPlaceId ?? `${p.name.toLowerCase()}|${p.latitude}`),
  );

  function add(suggestion: NearbySuggestion) {
    const place: Place = {
      id: createId(),
      externalPlaceId: suggestion.externalPlaceId,
      name: suggestion.name,
      category: suggestion.category,
      address: suggestion.address || trip.destination,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      visitDurationMinutes: duration,
      priority,
    };
    const result = onAdd(place);
    if (result !== false) toast.success(`${suggestion.name} adicionado ao roteiro.`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!hasReferences}
          title={
            hasReferences
              ? "Sugestões próximas aos primeiros lugares do seu roteiro"
              : "Adicione pelo menos um lugar ao roteiro para ver sugestões próximas."
          }
        >
          <Compass className="size-4" aria-hidden="true" />
          Ver lugares próximos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Descubra lugares próximos</DialogTitle>
          <DialogDescription>
            Sugestões próximas aos primeiros lugares do seu roteiro
            {trip.destination ? ` em ${trip.destination}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={item === category ? "default" : "outline"}
              disabled={loading}
              onClick={() => void load(item)}
            >
              {NEARBY_CATEGORY_LABELS[item]}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nearby-duration">Duração da visita</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger id="nearby-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nearby-priority">Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger id="nearby-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <>
              <p className="text-sm text-muted-foreground">Buscando lugares próximos…</p>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : error ? (
            <div className="space-y-3 py-6">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void load(category)}>
                  Tentar novamente
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Buscar lugar manualmente
                </Button>
              </div>
            </div>

          ) : (
            results
              .filter(
                (s) =>
                  !added.has(s.externalPlaceId) &&
                  !added.has(`${s.name.toLowerCase()}|${s.latitude}`),
              )
              .map((s) => (
                <div
                  key={s.externalPlaceId}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary">{s.categoryLabel}</Badge>
                    </div>
                    {s.address ? (
                      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {s.address}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      Aproximadamente {s.distanceKm.toFixed(1)} km dos lugares do seu roteiro
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=17/${s.latitude}/${s.longitude}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Ver no mapa
                      </a>
                    </Button>
                    <Button size="sm" onClick={() => add(s)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Adicionar ao roteiro
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Os resultados são fornecidos pelo OpenStreetMap. Se o serviço estiver indisponível, você
          poderá adicionar o local manualmente.

        </p>
      </DialogContent>
    </Dialog>
  );
}
