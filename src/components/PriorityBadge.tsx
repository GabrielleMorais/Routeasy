import { Badge } from "@/components/ui/badge";
import { priorityLabels } from "@/lib/labels";
import type { Priority } from "@/types/trip";
import { Star, Heart, CircleDashed } from "lucide-react";

const icons = {
  imperdivel: Star,
  quero_conhecer: Heart,
  opcional: CircleDashed,
} as const;

export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = icons[priority];
  return (
    <Badge
      variant={priority === "imperdivel" ? "default" : priority === "quero_conhecer" ? "secondary" : "outline"}
      className="gap-1"
    >
      <Icon className="size-3" aria-hidden="true" />
      {priorityLabels[priority]}
    </Badge>
  );
}
