import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Copy, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trip } from "@/types/trip";

const statusLabels: Record<Trip["status"], string> = {
  rascunho: "Rascunho",
  planejado: "Planejado",
  concluido: "Concluído",
};

interface Props {
  trip: Trip;
  onDuplicate: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

export function TripCard({ trip, onDuplicate, onDelete }: Props) {
  const period = `${format(parseISO(trip.startDate), "dd MMM", { locale: ptBR })} — ${format(
    parseISO(trip.endDate),
    "dd MMM yyyy",
    { locale: ptBR },
  )}`;

  return (
    <Card className="transition-shadow hover:shadow-[var(--shadow-lift)]">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-lg">{trip.title}</CardTitle>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {trip.destination}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações do roteiro ${trip.title}`}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/roteiro/$id" params={{ id: trip.id }}>
                <Pencil className="size-4" /> Abrir e editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(trip)}>
              <Copy className="size-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(trip)}>
              <Trash2 className="size-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" />
            {period}
          </span>
          <Badge variant="secondary">{trip.places.length} lugares</Badge>
          <Badge variant="outline">{statusLabels[trip.status]}</Badge>
          {trip.isDemo ? <Badge className="bg-coral text-coral-foreground">Demonstração</Badge> : null}
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/roteiro/$id" params={{ id: trip.id }}>
            Abrir roteiro
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
