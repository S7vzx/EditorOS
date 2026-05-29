import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { projectsQuery, demandsQuery } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — EditorOS" },
      {
        name: "description",
        content: "Deadlines, pedidos aprovados e entregas em um calendário moderno.",
      },
    ],
  }),
  loader: clientOnlyLoader(({ context }) => {
    context.queryClient.prefetchQuery(projectsQuery());
    context.queryClient.prefetchQuery(demandsQuery());
  }),
  component: CalendarioPage,
});

type EventKind = "deadline" | "demanda" | "entrega" | "gravacao" | "postagem";

interface CalEvent {
  id: string;
  date: string;
  title: string;
  kind: EventKind;
  time?: string | null;
  platform?: string | null;
}

const KIND_COLOR: Record<EventKind, string> = {
  deadline: "bg-rose-400/80",
  demanda: "bg-primary/80",
  entrega: "bg-emerald-400/80",
  gravacao: "bg-fuchsia-400/80",
  postagem: "bg-sky-400/80",
};

const KIND_LABEL: Record<EventKind, string> = {
  deadline: "Deadline",
  demanda: "Demanda",
  entrega: "Entrega",
  gravacao: "Gravação",
  postagem: "Postagem",
};

function CalendarioPage() {
  const [cursor, setCursor] = useState(() => new Date());

  const { data: projects = [] } = useQuery(projectsQuery());
  const { data: demands = [] } = useQuery(demandsQuery());

  const events: CalEvent[] = useMemo(() => {
    const e: CalEvent[] = [];
    for (const p of projects) {
      if (!p.deadline) continue;
      e.push({
        id: `p-${p.id}`,
        date: p.deadline,
        title: p.title,
        kind: p.status === "entregue" ? "entrega" : "deadline",
      });
    }
    for (const d of demands) {
      const k = (d.kind ?? "demanda") as "demanda" | "gravacao" | "postagem";
      if (k === "demanda" && d.status !== "aprovado") continue;
      const kind: EventKind = k === "demanda" ? "demanda" : k;
      e.push({
        id: `d-${d.id}`,
        date: d.scheduled_date,
        title: d.title,
        kind,
        time: d.scheduled_time,
        platform: d.platform,
      });
    }
    return e;
  }, [projects, demands]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Index O(1) por dia, evita N×M filters durante o render do grid
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date);
      if (arr) arr.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const start = startOfMonth(cursor);
    return [...events]
      .filter((e) => new Date(e.date + "T12:00:00") >= start)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [events, cursor]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Calendário</h1>
          <p className="mt-1 text-muted-foreground">
            Pedidos aprovados, deadlines e entregas em um único lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCursor(subMonths(cursor, 1))}
            className="grid size-9 place-items-center rounded-lg border border-neutral-800 text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-40 text-center text-sm font-medium capitalize">
            {format(cursor, "LLLL yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="grid size-9 place-items-center rounded-lg border border-neutral-800 text-muted-foreground transition hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="overflow-hidden rounded-[32px] bg-surface p-6 ring-1 ring-black/5 lg:col-span-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const inMonth = isSameMonth(d, cursor);
              const evs = eventsByDay.get(format(d, "yyyy-MM-dd")) ?? [];
              const today = isSameDay(d, new Date());
              return (
                <div
                  key={d.toISOString()}
                  className={cn(
                    "flex aspect-square flex-col rounded-xl p-2 ring-1 ring-transparent transition hover:ring-primary/20",
                    inMonth ? "bg-neutral-900/30" : "bg-transparent text-muted-foreground/50",
                    today && "ring-primary/40",
                  )}
                >
                  <span className={cn("text-xs font-medium", today && "text-primary")}>
                    {format(d, "d")}
                  </span>
                  <div className="mt-1 flex flex-1 flex-col gap-1 overflow-hidden">
                    {evs.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-background",
                          KIND_COLOR[e.kind],
                        )}
                        title={`${e.title}${e.time ? ` · ${e.time.slice(0, 5)}` : ""}`}
                      >
                        {e.time ? `${e.time.slice(0, 5)} ` : ""}
                        {e.title}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{evs.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <h3 className="px-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Próximos eventos
          </h3>
          <div className="space-y-2">
            {upcoming.length === 0 && (
              <p className="rounded-2xl border border-dashed border-neutral-800 p-6 text-center text-xs text-muted-foreground">
                Nenhum evento neste período.
              </p>
            )}
            {upcoming.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-black/5"
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_COLOR[e.kind])} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {format(new Date(e.date + "T12:00:00"), "EEE, d 'de' LLL", {
                      locale: ptBR,
                    })}
                    {e.time && ` · ${e.time.slice(0, 5)}`} · {KIND_LABEL[e.kind]}
                    {e.platform && ` · ${e.platform}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
