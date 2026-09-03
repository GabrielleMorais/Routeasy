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
  // e não mais o ponto de partida/hospedagem.
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
      // Consulta cada região de referência (1º e, se houver, 2º lugar do roteiro).
      const perReference: NearbySuggestion[][] = [];
      for (const ref of references) {
        if (controller.signal.aborted) return;
        try {
          perReference.push(await fetchNearbyPlaces(ref, next, 3000, controller.signal));
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn("[nearby] Busca falhou para uma das referências:", err);
        }
      }
      if (controller.signal.aborted) return;
      if (perReference.length === 0) throw new Error("Todas as consultas falharam.");

      // Mescla, remove duplicados e usa a menor distância até qualquer referência.
      const seen = new Set<string>();
      const merged: NearbySuggestion[] = [];
      for (const list of perReference) {
        for (const s of list) {
          const key = s.externalPlaceId;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(s);
        }
      }
      merged.sort((a, b) => a.distanceKm - b.distanceKm);
      const found = merged.slice(0, 10);
      setResults(found);
      if (found.length === 0) setError("Nenhum lugar encontrado nessa categoria por perto.");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn("[nearby] Busca falhou:", err);
      setResults([]);
      setError(
        "Não foi possível consultar o OpenStreetMap agora. Você pode cadastrar o lugar manualmente.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
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
        <Button variant="outline" disabled={!hasCenter}>
          <Compass className="size-4" aria-hidden="true" />
          Ver lugares próximos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Descubra lugares próximos</DialogTitle>
          <DialogDescription>
            Sugestões reais do OpenStreetMap a partir do seu ponto de partida
            {trip.destination ? ` em ${trip.destination}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={item === category ? "default" : "outline"}
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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : error ? (
            <p className="py-6 text-sm text-muted-foreground">{error}</p>
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
                      Aproximadamente {s.distanceKm.toFixed(1)} km do ponto de partida
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
          Fonte: OpenStreetMap (Overpass API). Máximo de 10 sugestões por busca.
        </p>
      </DialogContent>
    </Dialog>
  );
}
