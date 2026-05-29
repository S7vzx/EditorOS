import type { ProjectStatus } from "@/data/mock";
import { STATUS_LABEL } from "@/data/mock";
import { cn } from "@/lib/utils";

const STYLES: Record<ProjectStatus, string> = {
  briefing: "bg-neutral-800 text-muted-foreground border-neutral-700",
  edicao: "bg-primary/10 text-primary border-primary/20",
  thumbnail: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  revisao: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  entregue: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-tight",
        STYLES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
