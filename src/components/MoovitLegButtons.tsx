import { Bus } from "lucide-react";
import {
  createMoovitAppLink,
  createMoovitWebLink,
  isMobileDevice,
  isValidMoovitLeg,
  type LatLng,
  type MoovitLeg,
} from "@/services/maps";
import { Button } from "@/components/ui/button";

interface MoovitLegButtonsProps {
  origin: LatLng;
  originName: string;
  destination: LatLng;
  destinationName: string;
  /** Estilo compacto usado dentro da timeline. */
  size?: "sm" | "default";
  className?: string;
}

/**
 * Botões de um trecho no Moovit. No celular, o botão principal é um <a> com o
 * deeplink oficial do app (acionado pelo clique real do usuário) e um link
 * discreto para a versão web; no desktop, apenas o link web (abre o destino).
 * Só é renderizado quando o trecho tem coordenadas e nomes válidos.
 */
export function MoovitLegButtons({
  origin,
  originName,
  destination,
  destinationName,
  size = "default",
  className,
}: MoovitLegButtonsProps) {
  const leg: MoovitLeg = {
    originLat: origin.latitude,
    originLon: origin.longitude,
    originName,
    destinationLat: destination.latitude,
    destinationLon: destination.longitude,
    destinationName,
  };
  if (!isValidMoovitLeg(leg)) return null;

  const webUrl = createMoovitWebLink(leg);

  if (isMobileDevice()) {
    return (
      <span className={className}>
        <Button asChild size={size} variant="outline" className={size === "default" ? "w-full" : undefined}>
          <a href={createMoovitAppLink(leg)}>
            <Bus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
            Abrir trajeto no app Moovit
          </a>
        </Button>
        <a
          href={webUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 inline-block text-xs text-muted-foreground underline underline-offset-2"
        >
          Não abriu? Ver destino no site do Moovit
        </a>
      </span>
    );
  }

  return (
    <span className={className}>
      <Button asChild size={size} variant="outline" className={size === "default" ? "w-full" : undefined}>
        <a href={webUrl} target="_blank" rel="noreferrer noopener">
          <Bus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
          Ver destino no Moovit
        </a>
      </Button>
      <span className="mt-1 block text-xs text-muted-foreground">
        A versão web abre o destino, não necessariamente o trajeto completo.
      </span>
    </span>
  );
}

