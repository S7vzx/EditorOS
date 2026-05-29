import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Check, ChevronRight } from "lucide-react";
import { initialWorkflow } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow — EditorOS" },
      {
        name: "description",
        content: "Pipeline de produção: briefing, edição, color, exportação, entrega.",
      },
    ],
  }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const [stages, setStages] = useState<typeof initialWorkflow>(() => {
    if (typeof window === "undefined") return initialWorkflow;
    const saved = localStorage.getItem("editoros:workflow");
    return saved ? JSON.parse(saved) : initialWorkflow;
  });

  useEffect(() => {
    localStorage.setItem("editoros:workflow", JSON.stringify(stages));
  }, [stages]);

  const [openId, setOpenId] = useState<string | null>(stages[0]?.id ?? null);

  const total = useMemo(() => stages.reduce((sum, s) => sum + s.items.length, 0), [stages]);
  const done = useMemo(
    () => stages.reduce((sum, s) => sum + s.items.filter((i) => i.done).length, 0),
    [stages],
  );
  const progress = total ? Math.round((done / total) * 100) : 0;

  const toggleItem = (sid: string, iid: string) => {
    setStages((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, items: s.items.map((i) => (i.id === iid ? { ...i, done: !i.done } : i)) }
          : s,
      ),
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Workflow</h1>
        <p className="mt-1 text-muted-foreground">Pipeline completo de produção com checklists.</p>
      </div>

      <div className="rounded-[32px] bg-surface p-6 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Progresso geral</p>
            <p className="text-xs text-muted-foreground">
              {done} de {total} etapas concluídas
            </p>
          </div>
          <span className="text-3xl font-semibold tracking-tight text-primary">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {stages.map((s, i) => {
          const stageDone = s.items.every((i) => i.done);
          const stageStarted = s.items.some((i) => i.done);
          return (
            <button
              key={s.id}
              onClick={() => setOpenId(s.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-[18px] p-4 text-left ring-1 transition",
                openId === s.id
                  ? "bg-primary/10 ring-primary/40"
                  : stageDone
                    ? "bg-emerald-500/5 ring-emerald-500/20"
                    : stageStarted
                      ? "bg-surface ring-black/5"
                      : "bg-surface/40 ring-black/5 hover:bg-surface",
              )}
            >
              <span className="text-[10px] font-mono text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium">{s.name}</span>
              {stageDone && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                  <Check className="size-3" /> Concluído
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active stage details */}
      <div className="space-y-3">
        {stages.map((s) => {
          if (s.id !== openId) return null;
          return (
            <div key={s.id} className="rounded-[32px] bg-surface p-8 ring-1 ring-black/5">
              <div className="mb-6 flex items-center gap-2">
                <h3 className="text-xl font-medium tracking-tight">{s.name}</h3>
                <ChevronRight className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {s.items.filter((i) => i.done).length}/{s.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {s.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggleItem(s.id, it.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-neutral-900/50",
                      it.done && "opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-md border-2 transition-colors",
                        it.done
                          ? "border-primary bg-primary"
                          : "border-neutral-700 group-hover:border-primary",
                      )}
                    >
                      {it.done && <Check className="size-3 text-background" strokeWidth={3} />}
                    </span>
                    <span className={cn("text-sm", it.done && "line-through")}>{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
