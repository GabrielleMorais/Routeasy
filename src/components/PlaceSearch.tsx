import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { categoryLabels } from "@/lib/labels";
import { prioritizeByDestination, searchPlaces, usesOpenStreetMap, type GeoResult } from "@/services/maps";

interface Props {
  onSelect: (result: GeoResult) => void;
  /** Cidade/destino da viagem: prioriza resultados da mesma cidade/UF. */
  destination?: string | undefined;
}

export function PlaceSearch({ onSelect, destination }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  async function runSearch(term: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const found = await searchPlaces(term, controller.signal, { near: destination });
      if (!controller.signal.aborted) setResults(prioritizeByDestination(found, destination));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Não foi possível buscar lugares agora.");
      setResults(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // Debounce: respeita o limite de 1 requisição por segundo do Nominatim.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => void runSearch(term), 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    void runSearch(query.trim());
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>
          {usesOpenStreetMap ? "Busca de endereços reais (OpenStreetMap)" : "API de mapas não configurada"}
        </AlertTitle>
        <AlertDescription>
          Os resultados são fornecidos pelo OpenStreetMap. Se o serviço estiver indisponível, você
          poderá adicionar o local manualmente.
        </AlertDescription>
      </Alert>


      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="place-search">Buscar por nome ou endereço</Label>
          <Input
            id="place-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: MASP, Parque Ibirapuera, Av. Paulista 900"
          />
        </div>
        <Button type="submit" className="sm:mt-6" disabled={loading || query.trim().length < 2}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Buscar
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erro na busca</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {results && results.length === 0 && !loading ? (
        <Alert>
          <AlertTitle>Nenhum local encontrado</AlertTitle>
          <AlertDescription>
            Tente outro termo ou use a aba “Endereço manual” para cadastrar o lugar.
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="space-y-2">
        {(results ?? []).map((result) => {
          const location = [result.city, result.state].filter(Boolean).join(" — ");
          return (
            <li key={result.externalPlaceId}>
              <button
                type="button"
                onClick={() => onSelect(result)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent"
              >
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {result.name}
                  <Badge variant="outline">{categoryLabels[result.category]}</Badge>
                  {location ? <Badge variant="secondary">{location}</Badge> : null}
                  {result.isMock ? <Badge variant="secondary">Dados de demonstração</Badge> : null}
                </span>
                <span className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {result.address}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
