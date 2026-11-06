import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  SCHOLARSHIP_STATE_LABELS,
  type ScholarshipEffectiveState,
} from "@/lib/scholarships/rules";

const stateTones: Record<ScholarshipEffectiveState, BadgeTone> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  CLOSING_SOON: "warning",
  EXPIRED: "danger",
  ARCHIVED: "neutral",
};

export function ScholarshipStatusBadge({
  state,
  className,
}: {
  state: ScholarshipEffectiveState;
  className?: string;
}) {
  return (
    <Badge tone={stateTones[state]} className={className}>
      {SCHOLARSHIP_STATE_LABELS[state]}
    </Badge>
  );
}
