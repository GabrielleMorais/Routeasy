import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ItineraryDay } from "@/types/trip";

export function ConflictAlert({ days }: { days: ItineraryDay[] }) {
  const warnings = days.flatMap((day) =>
    day.items
      .filter((item) => item.warning)
      .map((item) => `Dia ${day.dayNumber} · ${item.title}: ${item.warning}`),
  );
  if (warnings.length === 0) return null;

  return (
    <Alert>
      <AlertTriangle className="size-4 text-alert" aria-hidden="true" />
      <AlertTitle>Atenção a {warnings.length} ponto(s) do roteiro</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
