import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Calendar as CalIcon,
  Clock,
  Search,
  Check,
  X,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { approveDemandAsProject, setDemandStatus, type DemandWithClient } from "@/lib/db";
import { demandsQuery, queryKeys } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — EditorOS" },
      {
        name: "description",
        content:
          "Caixa de entrada com demandas enviadas pelos clientes. Aprove para virar projeto.",
      },
    ],
  }),
  loader: clientOnlyLoader(({ context }) => {
    context.queryClient.prefetchQuery(demandsQuery());
  }),
  component: PedidosPage,
});

type Filter = "pendente" | "aprovado" | "recusado" | "todos";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pendente", label: "Pendentes" },
  { id: "aprovado", label: "Aprovados" },
  { id: "recusado", label: "Recusados" },
  { id: "todos", label: "Todos" },
];

const STATUS_STYLE: Record<DemandWithClient["status"], string> = {
  pendente: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  aprovado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  recusado: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

function PedidosPage() {
  const [filter, setFilter] = useState<Filter>("pendente");
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  // Restringe re-renders ao subset que importa para esta página
  // (somente demandas de aprovação) usando `select`.
  const { data: demands = [], isLoading } = useQuery({
    ...demandsQuery(),
    select: (rows) => rows.filter((d) => (d.kind ?? "demanda") === "demanda"),
  });

  const approve = useMutation({
    mutationFn: approveDemandAsProject,
    onSuccess: (_d, demand) => {
      qc.invalidateQueries({ queryKey: queryKeys.demands });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Pedido aprovado", {
        description: `${demand.title} entrou no Kanban.`,
      });
    },
    onError: () => toast.error("Não consegui aprovar o pedido."),
  });

  const reject = useMutation({
    mutationFn: (id: string) => setDemandStatus(id, "recusado"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.demands });
      toast.success("Pedido recusado");
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demands.filter((d) => {
      const matchesFilter = filter === "todos" || d.status === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.clients?.name.toLowerCase().includes(q) ||
        d.clients?.email.toLowerCase().includes(q)
      );
    });
  }, [demands, filter, query]);

  const pendingCount = useMemo(
    () => demands.filter((d) => d.status === "pendente").length,
    [demands],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
            <Inbox className="size-7 text-primary" /> Pedidos
          </h1>
          <p className="mt-1 text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? "pedido pendente" : "pedidos pendentes"} aguardando aprovação.`
              : "Nenhum pedido pendente. Tudo em dia."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, cliente ou email..."
            className="w-full rounded-lg bg-neutral-900/40 py-2 pl-10 pr-3 text-sm outline-none ring-1 ring-neutral-800 focus:bg-neutral-900 focus:ring-primary/50"
          />
        </div>
        <div className="flex rounded-lg bg-neutral-900/40 p-1 ring-1 ring-neutral-800">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filter === f.id
                  ? "bg-neutral-800 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-neutral-800 p-16 text-center">
          <Inbox className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum pedido encontrado nesse filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <DemandCard
              key={d.id}
              demand={d}
              busy={approve.isPending || reject.isPending}
              onApprove={() => approve.mutate(d)}
              onReject={() => reject.mutate(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DemandCard({
  demand,
  busy,
  onApprove,
  onReject,
}: {
  demand: DemandWithClient;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const date = new Date(demand.scheduled_date + "T12:00:00");
  return (
    <article className="rounded-[24px] bg-surface p-6 ring-1 ring-black/5 transition hover:ring-primary/20">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-medium">{demand.title}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                STATUS_STYLE[demand.status],
              )}
            >
              {demand.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{demand.clients?.name ?? "Cliente"}</span>{" "}
            · {demand.clients?.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 capitalize">
            {demand.type}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalIcon className="size-3.5" />
            {date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {demand.scheduled_time && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {demand.scheduled_time.slice(0, 5)}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
              demand.priority === "alta" && "bg-rose-500/15 text-rose-300",
              demand.priority === "media" && "bg-amber-400/15 text-amber-300",
              demand.priority === "baixa" && "bg-emerald-500/15 text-emerald-300",
            )}
          >
            {demand.priority}
          </span>
        </div>
      </header>

      {demand.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {demand.description}
        </p>
      )}

      {demand.refs && (
        <a
          href={demand.refs.startsWith("http") ? demand.refs : undefined}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
        >
          <LinkIcon className="size-3" /> {demand.refs}
        </a>
      )}

      {demand.status === "pendente" && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-800/60 pt-4">
          <button
            disabled={busy}
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            <Check className="size-4" strokeWidth={2.5} /> Aprovar e criar projeto
          </button>
          <button
            disabled={busy}
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
          >
            <X className="size-4" /> Recusar
          </button>
        </div>
      )}
    </article>
  );
}
