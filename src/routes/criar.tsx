import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Info, MapPinned, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { EmptyState } from "@/components/EmptyState";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceFormDialog } from "@/components/PlaceFormDialog";
import { TransportSelector } from "@/components/TransportSelector";
import { RouteMap } from "@/components/RouteMap";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paceLabels } from "@/lib/labels";
import { geocodeAddress } from "@/services/maps";
import { optimizeTrip } from "@/services/optimizer";
import { createId, createShareToken, tripStorage } from "@/services/storage";
import type { Place, Trip, TravelPace } from "@/types/trip";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar roteiro de viagem — Routeasy" },
      {
        name: "description",
        content:
          "Monte seu roteiro em quatro etapas: dados da viagem, lugares desejados, preferências e geração do itinerário otimizado.",
      },
      { property: "og:title", content: "Criar roteiro de viagem — Routeasy" },
      {
        property: "og:description",
        content: "Adicione lugares e receba um itinerário organizado por dia, sem cadastro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateTripStepper,
});

const stepLabels = ["Informações da viagem", "Adicionar lugares", "Preferências", "Gerar roteiro"];

function emptyTrip(): Trip {
  const today = format(new Date(), "yyyy-MM-dd");
  return {
    id: createId(),
    title: "",
    destination: "",
    startDate: today,
    endDate: today,
    accommodationAddress: "",
    accommodationLatitude: 0,
    accommodationLongitude: 0,
    dailyStartTime: "09:00",
    dailyEndTime: "19:00",
    transportMode: "transporte_publico",
    travelPace: "equilibrado",
    status: "rascunho",
    shareToken: createShareToken(),
    isPublic: false,
    places: [],
    preferences: {
      returnToAccommodation: true,
      maxTravelMinutes: 45,
      includeLunch: true,
      lunchTime: "12:30",
      lunchDurationMinutes: 60,
      includeDinner: false,
      dinnerTime: "19:30",
      avoidTolls: false,
      avoidLongWalks: false,
      accessibleOptions: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function CreateTripStepper() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [trip, setTrip] = useState<Trip>(emptyTrip);
  const [placeDialog, setPlaceDialog] = useState(false);
  const [editing, setEditing] = useState<Place | undefined>(undefined);

  const update = (patch: Partial<Trip>) => setTrip((prev) => ({ ...prev, ...patch }));
  const updatePrefs = (patch: Partial<Trip["preferences"]>) =>
    setTrip((prev) => ({ ...prev, preferences: { ...prev.preferences, ...patch } }));

  const step1Valid =
    trip.title.trim().length >= 3 &&
    trip.destination.trim().length >= 2 &&
    trip.accommodationAddress.trim().length >= 4 &&
    trip.startDate <= trip.endDate;

  function savePlace(place: Place) {
    setTrip((prev) => {
      const exists = prev.places.some((p) => p.id === place.id);
      return {
        ...prev,
        places: exists ? prev.places.map((p) => (p.id === place.id ? place : p)) : [...prev.places, place],
      };
    });
    setEditing(undefined);
  }

  function movePlace(place: Place, delta: number) {
    setTrip((prev) => {
      const index = prev.places.findIndex((p) => p.id === place.id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.places.length) return prev;
      const places = [...prev.places];
      const [item] = places.splice(index, 1);
      places.splice(target, 0, item!);
      return { ...prev, places };
    });
  }

  function generate() {
    const coords = geocodeAddress(trip.accommodationAddress);
    const withCoords: Trip = {
      ...trip,
      accommodationLatitude: coords.latitude,
      accommodationLongitude: coords.longitude,
      status: "planejado",
    };
    const result = optimizeTrip(withCoords);
    const saved = tripStorage.save({
      ...withCoords,
      itinerary: result.days,
      unscheduled: result.unscheduled,
    });
    toast.success("Roteiro gerado e salvo neste navegador.");
    navigate({ to: "/roteiro/$id", params: { id: saved.id } });
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Criar roteiro</h1>
          <Progress value={((step + 1) / 4) * 100} aria-label={`Etapa ${step + 1} de 4`} />
          <ol className="flex flex-wrap gap-2 text-sm" aria-label="Etapas">
            {stepLabels.map((label, index) => (
              <li key={label}>
                <Badge variant={index === step ? "default" : index < step ? "secondary" : "outline"}>
                  {index + 1}. {label}
                </Badge>
              </li>
            ))}
          </ol>
        </header>

        {step === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Informações da viagem</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Nome da viagem</Label>
                <Input
                  id="title"
                  value={trip.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Ex.: Férias em São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Cidade ou destino</Label>
                <Input
                  id="destination"
                  value={trip.destination}
                  onChange={(e) => update({ destination: e.target.value })}
                  placeholder="Ex.: São Paulo, SP"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accommodation">Hospedagem ou ponto de partida</Label>
                <Input
                  id="accommodation"
                  value={trip.accommodationAddress}
                  onChange={(e) => update({ accommodationAddress: e.target.value })}
                  placeholder="Ex.: Av. Paulista, 900 — São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start">Data inicial</Label>
                <Input
                  id="start"
                  type="date"
                  value={trip.startDate}
                  min={todayLocalISO()}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    if (!startDate) return;
                    setTrip((prev) => ({
                      ...prev,
                      startDate,
                      endDate: prev.endDate < startDate ? startDate : prev.endDate,
                    }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Data final</Label>
                <Input
                  id="end"
                  type="date"
                  value={trip.endDate}
                  min={trip.startDate}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    if (!endDate) return;
                    update({ endDate: endDate < trip.startDate ? trip.startDate : endDate });
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="daily-start">Começar o dia às</Label>
                <Input
                  id="daily-start"
                  type="time"
                  value={trip.dailyStartTime}
                  onChange={(e) => update({ dailyStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily-end">Terminar o dia às</Label>
                <Input
                  id="daily-end"
                  type="time"
                  value={trip.dailyEndTime}
                  onChange={(e) => update({ dailyEndTime: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Meio de transporte</Label>
                <TransportSelector
                  value={trip.transportMode}
                  onChange={(mode) => update({ transportMode: mode })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pace">Preferência de ritmo</Label>
                <Select
                  value={trip.travelPace}
                  onValueChange={(v) => update({ travelPace: v as TravelPace })}
                >
                  <SelectTrigger id="pace">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!step1Valid ? (
                <Alert className="sm:col-span-2">
                  <Info className="size-4" aria-hidden="true" />
                  <AlertTitle>Preencha os campos obrigatórios</AlertTitle>
                  <AlertDescription>
                    Nome da viagem, destino, hospedagem e um período válido são necessários para
                    seguir.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Lugares da viagem ({trip.places.length})</h2>
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setPlaceDialog(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Adicionar lugar
              </Button>
            </div>

            {trip.places.length < 3 ? (
              <Alert>
                <Info className="size-4" aria-hidden="true" />
                <AlertTitle>Adicione pelo menos três lugares</AlertTitle>
                <AlertDescription>
                  Com três ou mais lugares conseguimos montar uma rota realmente útil por dia.
                </AlertDescription>
              </Alert>
            ) : null}

            {trip.places.length === 0 ? (
              <EmptyState
                icon={MapPinned}
                title="Nenhum lugar adicionado"
                description="Busque um ponto turístico, restaurante ou hotel — ou cadastre um endereço manualmente."
                action={
                  <Button onClick={() => setPlaceDialog(true)}>Adicionar primeiro lugar</Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {trip.places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onEdit={(p) => {
                      setEditing(p);
                      setPlaceDialog(true);
                    }}
                    onRemove={(p) =>
                      setTrip((prev) => ({
                        ...prev,
                        places: prev.places.filter((item) => item.id !== p.id),
                      }))
                    }
                    onMoveUp={(p) => movePlace(p, -1)}
                    onMoveDown={(p) => movePlace(p, 1)}
                  />
                ))}
              </div>
            )}

            {trip.places.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lugares no mapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <RouteMap
                    trip={{
                      ...trip,
                      accommodationLatitude:
                        trip.accommodationLatitude || geocodeAddress(trip.accommodationAddress).latitude,
                      accommodationLongitude:
                        trip.accommodationLongitude ||
                        geocodeAddress(trip.accommodationAddress).longitude,
                    }}
                    days={[
                      {
                        id: "preview",
                        date: trip.startDate,
                        dayNumber: 1,
                        totalDistance: 0,
                        totalTravelMinutes: 0,
                        items: trip.places.map((p, index) => ({
                          id: `preview-${p.id}`,
                          placeId: p.id,
                          itemType: "visita",
                          title: p.name,
                          position: index,
                          startTime: "--:--",
                          endTime: "--:--",
                          status: "pendente",
                        })),
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle>Preferências de deslocamento e refeições</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:col-span-2">
                <Label htmlFor="return" className="font-normal">
                  Aceito sair e voltar para a hospedagem todos os dias
                </Label>
                <Switch
                  id="return"
                  checked={trip.preferences.returnToAccommodation}
                  onCheckedChange={(v) => updatePrefs({ returnToAccommodation: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-travel">Tempo máximo entre dois locais (minutos)</Label>
                <Input
                  id="max-travel"
                  type="number"
                  min={10}
                  max={180}
                  value={trip.preferences.maxTravelMinutes}
                  onChange={(e) => updatePrefs({ maxTravelMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lunch-duration">Duração do almoço (minutos)</Label>
                <Input
                  id="lunch-duration"
                  type="number"
                  min={20}
                  max={180}
                  value={trip.preferences.lunchDurationMinutes}
                  onChange={(e) => updatePrefs({ lunchDurationMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="lunch" className="font-normal">
                  Incluir intervalo para almoço
                </Label>
                <Switch
                  id="lunch"
                  checked={trip.preferences.includeLunch}
                  onCheckedChange={(v) => updatePrefs({ includeLunch: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lunch-time">Horário preferido do almoço</Label>
                <Input
                  id="lunch-time"
                  type="time"
                  value={trip.preferences.lunchTime}
                  onChange={(e) => updatePrefs({ lunchTime: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="dinner" className="font-normal">
                  Incluir intervalo para jantar
                </Label>
                <Switch
                  id="dinner"
                  checked={trip.preferences.includeDinner}
                  onCheckedChange={(v) => updatePrefs({ includeDinner: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dinner-time">Horário preferido do jantar</Label>
                <Input
                  id="dinner-time"
                  type="time"
                  value={trip.preferences.dinnerTime}
                  onChange={(e) => updatePrefs({ dinnerTime: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="tolls" className="font-normal">
                  Evitar pedágios
                </Label>
                <Switch
                  id="tolls"
                  checked={trip.preferences.avoidTolls}
                  onCheckedChange={(v) => updatePrefs({ avoidTolls: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="walks" className="font-normal">
                  Evitar caminhadas longas
                </Label>
                <Switch
                  id="walks"
                  checked={trip.preferences.avoidLongWalks}
                  onCheckedChange={(v) => updatePrefs({ avoidLongWalks: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:col-span-2">
                <Label htmlFor="accessible" className="font-normal">
                  Preciso de opções acessíveis para mobilidade reduzida
                </Label>
                <Switch
                  id="accessible"
                  checked={trip.preferences.accessibleOptions}
                  onCheckedChange={(v) => updatePrefs({ accessibleOptions: v })}
                />
              </div>
              <Alert className="sm:col-span-2">
                <Info className="size-4" aria-hidden="true" />
                <AlertTitle>Compromissos com horário fixo</AlertTitle>
                <AlertDescription>
                  Defina o horário fixo diretamente no lugar (etapa anterior), em “Horário fixo
                  (reserva ou ingresso)”.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tudo pronto para gerar seu roteiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Viagem: {trip.title || "—"}</li>
                <li>Destino: {trip.destination || "—"}</li>
                <li>
                  Período: {trip.startDate} até {trip.endDate}
                </li>
                <li>Lugares cadastrados: {trip.places.length}</li>
                <li>
                  Janela diária: {trip.dailyStartTime} às {trip.dailyEndTime}
                </li>
              </ul>
              <Alert>
                <Info className="size-4" aria-hidden="true" />
                <AlertTitle>Rota recomendada</AlertTitle>
                <AlertDescription>
                  O itinerário é otimizado com base nas informações disponíveis (distâncias
                  estimadas, horários de funcionamento, prioridades e ritmo). Você pode ajustar tudo
                  depois.
                </AlertDescription>
              </Alert>
              <Button size="lg" className="w-full" onClick={generate} disabled={trip.places.length === 0}>
                <Sparkles className="size-4" aria-hidden="true" />
                Gerar meu roteiro
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={step === 0 && !step1Valid}
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </main>

      <PlaceFormDialog
        open={placeDialog}
        onOpenChange={(open) => {
          setPlaceDialog(open);
          if (!open) setEditing(undefined);
        }}
        place={editing}
        onSave={savePlace}
      />
    </div>
  );
}
