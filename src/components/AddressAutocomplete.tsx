/**
 * Campo de endereço com autocomplete real (Nominatim/OpenStreetMap).
 * Reutiliza `searchPlaces` do serviço de mapas — nenhuma geocodificação nova.
 */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  searchPlaces,
  geocodeAddressAsync,
  geocodeErrorMessage,
  type GeoResult,
} from "@/services/maps";

export interface ConfirmedAddress {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string | undefined;
  source: "nominatim" | "manual";
}

interface Props {
  id?: string;
  label: string;
  value: string;
  /** Cidade/destino usado para priorizar resultados. */
  near?: string | undefined;
  confirmed: boolean;
  placeholder?: string;
  onTextChange: (value: string) => void;
  onConfirm: (address: ConfirmedAddress) => void;
}

function describe(result: GeoResult) {
  return [result.city, result.state, result.country].filter(Boolean).join(" · ");
}

export function AddressAutocomplete({
  id = "address-autocomplete",
  label,
  value,
  near,
  confirmed,
  placeholder,
  onTextChange,
  onConfirm,
}: Props) {
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const skipNext = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const term = value.trim();
    if (term.length < 3) {
      setResults(null);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const found = await searchPlaces(term, controller.signal, { near });
        if (!controller.signal.aborted) setResults(found);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Erro temporário na busca. Tente novamente em alguns segundos.");
        setResults(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [value, near]);

  function select(result: GeoResult) {
    skipNext.current = true;
    setResults(null);
    setError(null);
    onConfirm({
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      placeId: result.externalPlaceId,
      source: "nominatim",
    });
  }

  async function useManual() {
    const term = value.trim();
    if (term.length < 4) return;
    setManualLoading(true);
    setError(null);
    try {
      const coords = await geocodeAddressAsync(term);
      skipNext.current = true;
      setResults(null);
      onConfirm({
        name: term,
        address: term,
        latitude: coords.latitude,
        longitude: coords.longitude,
        placeId: undefined,
        source: "manual",
      });
    } catch (err) {
      setError(geocodeErrorMessage(err));
    } finally {
      setManualLoading(false);
    }
  }

  const showEmpty = !loading && !error && results !== null && results.length === 0;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => onTextChange(e.target.value)}
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {confirmed ? (
        <p className="flex items-center gap-1.5 text-sm text-primary">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Localização confirmada
        </p>
      ) : value.trim().length >= 3 ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Selecione um endereço da lista para confirmar o ponto de partida.
        </p>
      ) : null}

      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={manualLoading}
            onClick={() => void useManual()}
          >
            {manualLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
          <p className="text-muted-foreground">Nenhum endereço encontrado para esse termo.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void useManual()} disabled={manualLoading}>
            {manualLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Usar este endereço manualmente
          </Button>
        </div>
      ) : null}

      {results && results.length > 0 && !confirmed ? (
        <ul className="max-h-72 space-y-1.5 overflow-auto rounded-xl border border-border p-1.5">
          {results.map((result) => (
            <li key={result.externalPlaceId}>
              <button
                type="button"
                onClick={() => select(result)}
                className="w-full rounded-lg p-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent"
              >
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {result.name}
                  {result.placeType ? <Badge variant="outline">{result.placeType}</Badge> : null}
                  {result.isMock ? <Badge variant="secondary">Demonstração</Badge> : null}
                </span>
                <span className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {result.address}
                </span>
                {describe(result) ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{describe(result)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
