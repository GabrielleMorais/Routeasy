import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceSearch } from "@/components/PlaceSearch";
import { categoryLabels, durationOptions, priorityLabels } from "@/lib/labels";
import { geocodeAddressAsync, geocodeErrorMessage, type GeoResult } from "@/services/maps";
import { createId } from "@/services/storage";
import type { Place, PlaceCategory, Priority } from "@/types/trip";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do lugar"),
  address: z.string().min(4, "Informe o endereço"),
  category: z.string(),
  visitDurationMinutes: z.coerce.number().min(10, "Mínimo de 10 minutos").max(600),
  priority: z.string(),
  notes: z.string().optional(),
  mealTag: z.string(),
  fixedStartTime: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place?: Place | undefined;
  /** Retorne `false` para manter o diálogo aberto (ex.: lugar duplicado). */
  onSave: (place: Place) => boolean | void;
  /** Cidade/destino da viagem: prioriza resultados da busca nessa região. */
  destination?: string | undefined;
}


export function PlaceFormDialog({ open, onOpenChange, place, onSave, destination }: Props) {
  const [tab, setTab] = useState(place ? "detalhes" : "buscar");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [externalId, setExternalId] = useState<string | undefined>(undefined);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      category: "ponto_turistico",
      visitDurationMinutes: 90,
      priority: "quero_conhecer",
      notes: "",
      mealTag: "nenhum",
      fixedStartTime: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setTab(place ? "detalhes" : "buscar");
    form.reset({
      name: place?.name ?? "",
      address: place?.address ?? "",
      category: place?.category ?? "ponto_turistico",
      visitDurationMinutes: place?.visitDurationMinutes ?? 90,
      priority: place?.priority ?? "quero_conhecer",
      notes: place?.notes ?? "",
      mealTag: place?.mealTag ?? "nenhum",
      fixedStartTime: place?.fixedStartTime ?? "",
    });
    setCoords(
      place ? { latitude: place.latitude, longitude: place.longitude } : null,
    );
    setExternalId(place?.externalPlaceId);
    setGeoError(null);
    setGeocoding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, place]);

  function applySearchResult(result: GeoResult) {
    form.setValue("name", result.name);
    form.setValue("address", result.address);
    form.setValue("category", result.category);
    setCoords({ latitude: result.latitude, longitude: result.longitude });
    setExternalId(result.externalPlaceId);
    setTab("detalhes");
  }

  const submit = form.handleSubmit(async (values) => {
    let location = coords;
    if (!location) {
      setGeoError(null);
      setGeocoding(true);
      try {
        location = await geocodeAddressAsync(values.address);
      } catch (err) {
        setGeoError(geocodeErrorMessage(err));
        return;
      } finally {
        setGeocoding(false);
      }
    }
    const next: Place = {
      id: place?.id ?? createId(),
      name: values.name,
      address: values.address,
      category: values.category as PlaceCategory,
      latitude: location.latitude,
      longitude: location.longitude,
      visitDurationMinutes: Number(values.visitDurationMinutes),
      priority: values.priority as Priority,
      notes: values.notes || undefined,
      mealTag: values.mealTag === "nenhum" ? null : (values.mealTag as "almoco" | "jantar"),
      fixedStartTime: values.fixedStartTime || undefined,
      isLocked: place?.isLocked ?? false,
      rating: place?.rating,
      openingHours: place?.openingHours,
      externalPlaceId: externalId,
    };
    if (onSave(next) === false) return;
    form.reset({
      name: "",
      address: "",
      category: "ponto_turistico",
      visitDurationMinutes: 90,
      priority: "quero_conhecer",
      notes: "",
      mealTag: "nenhum",
      fixedStartTime: "",
    });
    setCoords(null);
    setExternalId(undefined);
    setTab("buscar");
    onOpenChange(false);
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{place ? "Editar lugar" : "Adicionar lugar"}</DialogTitle>
          <DialogDescription>
            Busque um local ou informe um endereço manualmente e ajuste os detalhes da visita.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            {!place ? <TabsTrigger value="buscar">Buscar</TabsTrigger> : null}
            <TabsTrigger value="detalhes">Detalhes da visita</TabsTrigger>
          </TabsList>

          {!place ? (
            <TabsContent value="buscar" className="pt-4">
              <PlaceSearch onSelect={applySearchResult} destination={destination} />
              <Button variant="outline" className="mt-4 w-full" onClick={() => setTab("detalhes")}>
                Adicionar endereço manualmente
              </Button>
            </TabsContent>
          ) : null}

          <TabsContent value="detalhes" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="place-name">Nome do lugar</Label>
                <Input id="place-name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="place-address">Endereço</Label>
                <Input
                  id="place-address"
                  {...form.register("address", {
                    onChange: () => {
                      // Endereço editado: coordenadas anteriores deixam de valer.
                      setCoords(null);
                      setExternalId(undefined);
                      setGeoError(null);
                    },
                  })}
                />
                {form.formState.errors.address ? (
                  <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                ) : null}
                {geoError ? <p className="text-sm text-destructive">{geoError}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="place-category">Categoria</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(v) => form.setValue("category", v)}
                >
                  <SelectTrigger id="place-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="place-priority">Prioridade</Label>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(v) => form.setValue("priority", v)}
                >
                  <SelectTrigger id="place-priority">
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
              <div className="space-y-1.5">
                <Label htmlFor="place-duration">Tempo estimado de visita (minutos)</Label>
                <Input
                  id="place-duration"
                  type="number"
                  min={10}
                  step={5}
                  {...form.register("visitDurationMinutes")}
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {durationOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => form.setValue("visitDurationMinutes", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                {form.formState.errors.visitDurationMinutes ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.visitDurationMinutes.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="place-fixed">Horário fixo (reserva ou ingresso)</Label>
                <Input id="place-fixed" type="time" {...form.register("fixedStartTime")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="place-meal">Marcar como refeição</Label>
                <Select value={form.watch("mealTag")} onValueChange={(v) => form.setValue("mealTag", v)}>
                  <SelectTrigger id="place-meal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Não é refeição</SelectItem>
                    <SelectItem value="almoco">Almoço</SelectItem>
                    <SelectItem value="jantar">Jantar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="place-notes">Observações</Label>
                <Textarea id="place-notes" rows={3} {...form.register("notes")} />
              </div>
              {place ? (
                <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
                  <Label htmlFor="place-locked" className="font-normal">
                    Bloquear este lugar para não ser alterado pela otimização
                  </Label>
                  <Switch
                    id="place-locked"
                    checked={Boolean(place.isLocked)}
                    onCheckedChange={(checked) => onSave({ ...place, isLocked: checked })}
                  />
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={geocoding}>
            {geocoding ? "Validando endereço…" : place ? "Salvar alterações" : "Adicionar lugar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
