import { Bike, Bus, Car, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transportLabels } from "@/lib/labels";
import type { TransportMode } from "@/types/trip";

const options: { value: TransportMode; icon: typeof Car }[] = [
  { value: "carro", icon: Car },
  { value: "transporte_publico", icon: Bus },
  { value: "bicicleta", icon: Bike },
  { value: "a_pe", icon: Footprints },
];

export function TransportSelector({
  value,
  onChange,
}: {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Meio de transporte">
      {options.map(({ value: option, icon: Icon }) => {
        const selected = option === value;
        return (
          <Button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            variant={selected ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-4"
            onClick={() => onChange(option)}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-xs font-medium">{transportLabels[option]}</span>
          </Button>
        );
      })}
    </div>
  );
}
