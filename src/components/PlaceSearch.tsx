import { useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { categoryLabels } from "@/lib/labels";
import { isMapsConfigured, searchPlaces, type GeoResult } from "@/services/maps";

export function PlaceSearch({ onSelect }: { onSelect: (result: GeoResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const found = await searchPlaces(query);
      setResults(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível buscar lugares agora.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isMapsConfigured ? (
        <Alert>
          <AlertTitle>API de mapas não configurada</AlertTitle>
          <AlertDescription>
            A busca usa uma base de demonstração (São Paulo e Rio de Janeiro). Você também pode
            adicionar qualquer endereço manualmente.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="place-search">Buscar por nome ou endereço</Label>
          <Input
            id="place-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: MASP, Parque Ibirapuera, Mercado Municipal"
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
        {(results ?? []).map((result) => (
          <li key={result.externalPlaceId}>
            <button
              type="button"
              onClick={() => onSelect(result)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent"
            >
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {result.name}
                <Badge variant="outline">{categoryLabels[result.category]}</Badge>
                {result.isMock ? <Badge variant="secondary">Dados de demonstração</Badge> : null}
              </span>
              <span className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {result.address}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
