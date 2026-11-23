import { formatLimaTime } from "@/shared/date/format-lima-time";
import type { SummaryStatus } from "../types";

const statusDotClassName: Record<SummaryStatus["kind"], string> = {
  empty: "bg-muted",
  draft: "bg-code-ink",
  sent: "bg-consent-check",
};

function getStatusLabel(status: SummaryStatus): string {
  switch (status.kind) {
    case "empty":
      return "Sin resumen";
    case "draft":
      return "Borrador";
    case "sent":
      return `Enviado a las ${formatLimaTime(status.sentAt)}`;
  }
}

type SummaryStatusBadgeProps = {
  status: SummaryStatus;
};

export function SummaryStatusBadge({ status }: SummaryStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold text-nav">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${statusDotClassName[status.kind]}`}
      />
      {getStatusLabel(status)}
    </span>
  );
}
