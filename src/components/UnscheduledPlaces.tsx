import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { UnscheduledPlace } from "@/types/trip";

export function UnscheduledPlaces({ places }: { places: UnscheduledPlace[] }) {
  if (places.length === 0) return null;
  return (
    <Accordion type="single" collapsible defaultValue="nao-incluidos">
      <AccordionItem value="nao-incluidos">
        <AccordionTrigger>Não incluídos no roteiro ({places.length})</AccordionTrigger>
        <AccordionContent className="space-y-2">
          {places.map((place) => (
            <Alert key={place.placeId}>
              <AlertTitle>{place.name}</AlertTitle>
              <AlertDescription>{place.reason}</AlertDescription>
            </Alert>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
