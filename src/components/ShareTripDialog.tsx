import { useState } from "react";
import { Copy, FileText, MessageCircle, Printer, Share2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { encodeTrip } from "@/services/storage";
import type { Trip } from "@/types/trip";

function buildSummary(trip: Trip): string {
  const lines = [`*${trip.title}* — ${trip.destination}`];
  (trip.itinerary ?? []).forEach((day) => {
    lines.push("", `Dia ${day.dayNumber} (${day.date})`);
    day.items
      .filter((item) => item.itemType !== "deslocamento")
      .forEach((item) => lines.push(`${item.startTime}–${item.endTime} ${item.title}`));
  });
  lines.push("", "Roteiro recomendado com base nas informações disponíveis — Routeasy");
  return lines.join("\n");
}

export function ShareTripDialog({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/compartilhado/${encodeTrip(trip)}`
      : "";
  const summary = buildSummary(trip);

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente o texto exibido.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="size-4" aria-hidden="true" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar roteiro</DialogTitle>
          <DialogDescription>
            O link contém o roteiro codificado, sem nenhum dado pessoal, e abre em modo somente
            leitura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="share-link">Link público</Label>
          <div className="flex gap-2">
            <Input id="share-link" readOnly value={link} />
            <Button
              variant="secondary"
              onClick={() => copy(link, "Link copiado!")}
              aria-label="Copiar link"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={() => copy(summary, "Resumo copiado para o WhatsApp!")}>
            <MessageCircle className="size-4" aria-hidden="true" />
            Resumo WhatsApp
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="size-4" aria-hidden="true" />
            Exportar PDF
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Para exportar em PDF, escolha “Salvar como PDF” na janela de impressão.
        </p>
      </DialogContent>
    </Dialog>
  );
}
