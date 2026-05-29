import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  Plus,
  Calendar as CalIcon,
  Clock,
  Inbox,
  Loader2,
  Video,
  Send,
  ListChecks,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { deleteDemand, type DemandRow, type DemandKind } from "@/lib/db";
import { ownerQuery, ownerDemandsQuery, queryKeys } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cliente/")({
  head: () => ({
    meta: [
      { title: "Agenda — EditorOS Planejamento" },
      {
        name: "description",
        content: "Veja em um só lugar suas demandas, dias de gravação e horários de postagem.",
      },
    ],
  }),
  loader: clientOnlyLoader(async ({ context }) => {
    const owner = await context.queryClient.ensureQueryData(ownerQuery());
    context.queryClient.prefetchQuery(ownerDemandsQuery(owner.id));
  }),
  component: ClientHomePage,
});

type KindFilter = "tudo" | DemandKind;

const KIND_META: Record<
  DemandKind,
  { label: string; icon: typeof Video; dot: string; chip: string }
> = {
  demanda: {
    label: "Demanda",
    icon: ListChecks,
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
  },
  gravacao: {
    label: "Gravação",
    icon: Video,
    dot: "bg-rose-400",
    chip: "bg-rose-400/10 text-rose-300 border-rose-400/30",
  },
  postagem: {
    label: "Postagem",
    icon: Send,
    dot: "bg-emerald-400",
    chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
  },
};

function ClientHomePage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<KindFilter>("tudo");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const { data: owner } = useQuery(ownerQuery());
  const ownerId = owner?.id ?? null;

  const { data: items = [], isLoading } = useQuery(ownerDemandsQuery(ownerId));

  const remove = useMutation({
    mutationFn: deleteDemand,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ownerDemands(ownerId) });
      qc.invalidateQueries({ queryKey: queryKeys.demands });
      toast.success("Item removido");
    },
  });

  const filtered = useMemo(
    () => (filter === "tudo" ? items : items.filter((i) => (i.kind as DemandKind) === filter)),
    [items, filter],
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, DemandRow[]>();
    for (const it of filtered) {
      const key = it.scheduled_date;
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [filtered]);

  const upcoming = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const base = selected
      ? filtered.filter((i) => i.scheduled_date === format(selected, "yyyy-MM-dd"))
      : filtered.filter((i) => i.scheduled_date >= today);
    return base.slice().sort((a, b) => {
      if (a.scheduled_date !== b.scheduled_date)
        return a.scheduled_date.localeCompare(b.scheduled_date);
      return (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "");
    });
  }, [filtered, selected]);

  type Row =
    | { type: "header"; date: string; count: number; isToday: boolean }
    | { type: "item"; item: DemandRow };

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, DemandRow[]>();
    for (const it of upcoming) {
      const arr = map.get(it.scheduled_date) ?? [];
      arr.push(it);
      map.set(it.scheduled_date, arr);
    }
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const out: Row[] = [];
    for (const [date, list] of map.entries()) {
      const sorted = list
        .slice()
        .sort((a, b) => (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? ""));
      out.push({
        type: "header",
        date,
        count: sorted.length,
        isToday: date === todayStr,
      });
      for (const it of sorted) out.push({ type: "item", item: it });
    }
    return out;
  }, [upcoming]);

  const counts = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const upc = items.filter((i) => i.scheduled_date >= today);
    return {
      total: upc.length,
      demanda: upc.filter((i) => i.kind === "demanda").length,
      gravacao: upc.filter((i) => i.kind === "gravacao").length,
      postagem: upc.filter((i) => i.kind === "postagem").length,
    };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Sua agenda</h1>
          <p className="mt-2 max-w-[60ch] text-muted-foreground">
            Marque dias de gravação, horários de postagem e demandas para o editor. Tudo flui
            automaticamente para o painel do editor.
          </p>
        </div>
        <Link
          to="/cliente/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition active:scale-95 hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2.5} /> Novo
        </Link>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Próximos" value={counts.total} accent="bg-foreground/80" />
        <Kpi label="Demandas" value={counts.demanda} accent="bg-primary" />
        <Kpi label="Gravações" value={counts.gravacao} accent="bg-rose-400" />
        <Kpi label="Postagens" value={counts.postagem} accent="bg-emerald-400" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Mini calendário */}
        <div className="rounded-[24px] bg-surface p-5 ring-1 ring-black/5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold capitalize">
              {format(cursor, "LLLL yyyy", { locale: ptBR })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(subMonths(cursor, 1))}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-neutral-900 hover:text-foreground"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => {
                  setCursor(new Date());
                  setSelected(null);
                }}
                className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                Hoje
              </button>
              <button
                onClick={() => setCursor(addMonths(cursor, 1))}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-neutral-900 hover:text-foreground"
                aria-label="Próximo mês"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const evs = itemsByDay.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const isSel = selected && isSameDay(d, selected);
              return (
                <button
                  key={key}
                  onClick={() => setSelected((s) => (s && isSameDay(s, d) ? null : d))}
                  className={cn(
                    "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-xs transition",
                    inMonth ? "text-foreground" : "text-muted-foreground/40",
                    isSel ? "bg-primary text-primary-foreground" : "hover:bg-neutral-900",
                    isToday(d) && !isSel && "ring-1 ring-primary/50",
                  )}
                >
                  <span className="font-medium">{format(d, "d")}</span>
                  {evs.length > 0 && (
                    <span className="flex gap-0.5">
                      {Array.from(new Set(evs.map((e) => e.kind as DemandKind)))
                        .slice(0, 3)
                        .map((k) => (
                          <span
                            key={k}
                            className={cn(
                              "size-1.5 rounded-full",
                              KIND_META[k]?.dot ?? "bg-foreground",
                              isSel && "bg-primary-foreground",
                            )}
                          />
                        ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            {selected
              ? `Mostrando ${format(selected, "EEE, d 'de' LLL", { locale: ptBR })}`
              : "Toque em um dia para filtrar."}
          </p>
        </div>

        {/* Lista */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-lg bg-neutral-900/40 p-1 ring-1 ring-neutral-800">
              {(["tudo", "demanda", "gravacao", "postagem"] as KindFilter[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition",
                    filter === k
                      ? "bg-neutral-800 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k === "tudo" ? "Tudo" : KIND_META[k as DemandKind].label}
                </button>
              ))}
            </div>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Limpar dia
              </button>
            )}
          </div>

          {!ownerId || isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            <VirtualList rows={rows} onDelete={(id) => remove.mutate(id)} />
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className={cn("size-2 rounded-full", accent)} />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-neutral-800 p-12 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-3 text-base font-medium">Nada por aqui ainda</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Adicione sua primeira gravação, postagem ou demanda.
      </p>
      <Link
        to="/cliente/novo"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
      >
        <Plus className="size-4" /> Adicionar agora
      </Link>
    </div>
  );
}

type RowItem =
  | { type: "header"; date: string; count: number; isToday: boolean }
  | { type: "item"; item: DemandRow };

function VirtualList({ rows, onDelete }: { rows: RowItem[]; onDelete: (id: string) => void }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = parentRef.current;
      if (!el) return;
      setOffset(el.getBoundingClientRect().top + window.scrollY);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: (i) => (rows[i]?.type === "header" ? 44 : 116),
    overscan: 6,
    scrollMargin: offset,
    getItemKey: (i) => {
      const r = rows[i];
      return r.type === "header" ? `h:${r.date}` : `i:${r.item.id}`;
    },
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="relative">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {items.map((v) => {
          const row = rows[v.index];
          return (
            <div
              key={v.key}
              data-index={v.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {row.type === "header" ? (
                <HeaderRow date={row.date} count={row.count} />
              ) : (
                <div className="pb-2">
                  <EventRow item={row.item} onDelete={onDelete} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderRow({ date, count }: { date: string; count: number }) {
  const d = new Date(date + "T12:00:00");
  const today = isToday(d);
  return (
    <div className="flex items-baseline gap-3 px-1 pb-2 pt-4">
      <h2 className="text-sm font-semibold capitalize">
        {format(d, "EEE, d 'de' LLLL", { locale: ptBR })}
      </h2>
      {today && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Hoje
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {count} {count === 1 ? "item" : "itens"}
      </span>
    </div>
  );
}

function EventRow({ item, onDelete }: { item: DemandRow; onDelete: (id: string) => void }) {
  const kind = (item.kind as DemandKind) ?? "demanda";
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const time = item.scheduled_time?.slice(0, 5);
  const endTime = item.end_time?.slice(0, 5);
  return (
    <article className="group flex items-start gap-4 rounded-2xl bg-surface p-4 ring-1 ring-black/5 transition hover:ring-primary/20">
      <div
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border",
          meta.chip,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium">{item.title}</h3>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              meta.chip,
            )}
          >
            {meta.label}
          </span>
          {kind === "demanda" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                item.status === "aprovado" && "bg-emerald-500/15 text-emerald-300",
                item.status === "pendente" && "bg-amber-400/15 text-amber-300",
                item.status === "recusado" && "bg-rose-500/15 text-rose-300",
              )}
            >
              {item.status}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {time}
              {endTime ? ` – ${endTime}` : ""}
            </span>
          )}
          {item.platform && (
            <span className="inline-flex items-center gap-1 capitalize">
              <Send className="size-3" />
              {item.platform}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {item.location}
            </span>
          )}
          {!time && !item.platform && !item.location && (
            <span className="inline-flex items-center gap-1">
              <CalIcon className="size-3" />
              Dia inteiro
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 transition group-hover:opacity-100"
        aria-label="Remover"
        title="Remover"
      >
        <Trash2 className="size-4 text-muted-foreground hover:text-rose-400" />
      </button>
    </article>
  );
}
