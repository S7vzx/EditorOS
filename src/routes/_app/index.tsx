import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ArrowUpRight, Plus, Video, Image as ImageIcon, Scissors } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/db";
import { projectsQuery, demandsQuery } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { initialTasks, type Task } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EditorOS" },
      {
        name: "description",
        content: "Painel principal do EditorOS com projetos ativos, tarefas e produtividade.",
      },
    ],
  }),
  loader: clientOnlyLoader(({ context }) => {
    context.queryClient.prefetchQuery(projectsQuery());
    context.queryClient.prefetchQuery(demandsQuery());
  }),
  component: DashboardPage,
});

const WEEK = [
  { day: "Seg", h: 40 },
  { day: "Ter", h: 65 },
  { day: "Qua", h: 55 },
  { day: "Qui", h: 90 },
  { day: "Sex", h: 75 },
  { day: "Sab", h: 60 },
  { day: "Dom", h: 45 },
];

const PILL: Record<ProjectStatus, string> = {
  briefing: "bg-neutral-800 text-muted-foreground border-neutral-700",
  edicao: "bg-primary/10 text-primary border-primary/20",
  thumbnail: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  revisao: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  entregue: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function typeIcon(t: string) {
  if (t === "video") return Video;
  if (t === "thumb") return ImageIcon;
  return Scissors;
}

function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return initialTasks;
    const saved = localStorage.getItem("editoros:tasks");
    return saved ? JSON.parse(saved) : initialTasks;
  });

  useEffect(() => {
    localStorage.setItem("editoros:tasks", JSON.stringify(tasks));
  }, [tasks]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContext, setTaskContext] = useState("");

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      toast.error("O título da tarefa não pode ser vazio.");
      return;
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      context: taskContext.trim() || undefined,
      done: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setTaskTitle("");
    setTaskContext("");
    setIsAddingTask(false);
    toast.success("Tarefa adicionada!");
  };

  // Dashboard só precisa do recorte ativo: `select` evita re-render
  // quando outras propriedades dos projetos mudam.
  const { data: activeProjects = [] } = useQuery({
    ...projectsQuery(),
    select: (rows) => rows.filter((p) => p.status !== "entregue"),
  });
  const { data: deliveredCount = 0 } = useQuery({
    ...projectsQuery(),
    select: (rows) => rows.filter((p) => p.status === "entregue").length,
  });
  const { data: pendingDemands = 0 } = useQuery({
    ...demandsQuery(),
    select: (rows) =>
      rows.filter((d) => d.status === "pendente" && (d.kind ?? "demanda") === "demanda").length,
  });

  const projects = useMemo(() => activeProjects.slice(0, 4), [activeProjects]);

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const todayIdx = 4;

  return (
    <div className="mx-auto max-w-7xl space-y-12 p-6 md:p-10">
      <section className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Bem-vindo
        </h1>
        <p className="max-w-[58ch] text-pretty text-muted-foreground">
          Você tem <span className="text-foreground">{activeProjects.length}</span> projetos no
          pipeline e <span className="text-foreground">{pendingDemands}</span>{" "}
          {pendingDemands === 1 ? "pedido novo" : "pedidos novos"} de clientes aguardando aprovação.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <StatCard
          label="Projetos ativos"
          value={String(activeProjects.length)}
          delta="no pipeline"
        />
        <StatCard
          label="Pedidos pendentes"
          value={String(pendingDemands)}
          delta={pendingDemands > 0 ? "ver caixa" : "tudo em dia"}
          accent
          href="/pedidos"
        />
        <StatCard label="Entregues" value={String(deliveredCount)} delta="total" />
      </section>

      <section className="overflow-hidden rounded-[32px] bg-surface ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-3 p-8 pb-0">
          <div>
            <h3 className="text-xl font-medium tracking-tight">Produtividade semanal</h3>
            <p className="text-sm text-muted-foreground">Horas de edição vs. rendimento</p>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Meta atingida
          </div>
        </div>
        <div className="p-8">
          <div className="flex h-48 w-full items-end justify-between gap-3 md:gap-4">
            {WEEK.map((d, i) => (
              <div
                key={d.day}
                className={cn(
                  "w-full rounded-t-xl transition-colors",
                  i === todayIdx ? "bg-primary" : "bg-neutral-800/40 hover:bg-primary/20",
                )}
                style={{ height: `${d.h}%` }}
                title={`${d.day}: ${d.h}%`}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {WEEK.map((d, i) => (
              <span key={d.day} className={i === todayIdx ? "text-primary" : ""}>
                {d.day}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-medium tracking-tight">Projetos ativos</h2>
            <Link
              to="/projetos"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              Ver todos <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="rounded-[24px] border border-dashed border-neutral-800 p-12 text-center text-sm text-muted-foreground">
                Nenhum projeto ativo. Crie um em{" "}
                <Link to="/projetos" className="text-primary underline">
                  Projetos
                </Link>
                .
              </p>
            )}
            {projects.map((p) => {
              const Icon = typeIcon(p.type);
              return (
                <Link
                  key={p.id}
                  to="/projetos"
                  className="group flex items-center justify-between rounded-[24px] bg-surface p-5 ring-1 ring-black/5 transition-all hover:ring-primary/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-[14px] bg-neutral-800 outline-1 -outline-offset-1 outline-black/5">
                      <Icon
                        className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-medium">{p.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Cliente: {p.client_name ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-6">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-tight",
                        PILL[p.status as ProjectStatus],
                      )}
                    >
                      {PROJECT_STATUS_LABEL[p.status as ProjectStatus]}
                    </span>
                    <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                      {p.deadline
                        ? new Date(p.deadline + "T12:00:00").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "—"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="px-2 text-2xl font-medium tracking-tight">Tarefas do dia</h2>
          <div className="space-y-4 rounded-[32px] bg-neutral-900/50 p-6 ring-1 ring-black/5">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={cn(
                  "group flex w-full items-start gap-3 text-left transition-opacity",
                  t.done && "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "mt-1 grid size-5 place-items-center rounded-md border-2 transition-colors",
                    t.done
                      ? "border-primary bg-primary"
                      : "border-neutral-700 group-hover:border-primary",
                  )}
                >
                  {t.done && <Check className="size-3 text-background" strokeWidth={3} />}
                </span>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", t.done && "line-through")}>{t.title}</p>
                  {t.context && <p className="mt-1 text-xs text-muted-foreground">{t.context}</p>}
                </div>
              </button>
            ))}
            {isAddingTask ? (
              <div className="mt-2 space-y-2 rounded-xl bg-neutral-950 p-4 ring-1 ring-neutral-800 animate-in fade-in zoom-in-95 duration-200">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Título da tarefa..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs outline-none focus:border-primary/50 text-foreground"
                  autoFocus
                />
                <input
                  value={taskContext}
                  onChange={(e) => setTaskContext(e.target.value)}
                  placeholder="Contexto/Projeto (opcional)..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs outline-none focus:border-primary/50 text-foreground"
                />
                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    onClick={() => setIsAddingTask(false)}
                    className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md font-semibold transition hover:brightness-110"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTask(true)}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-800 py-3 text-xs text-muted-foreground transition hover:border-neutral-600 hover:text-foreground"
              >
                <Plus className="size-3.5" /> Adicionar nova tarefa
              </button>
            )}
          </div>

          <Link
            to="/pedidos"
            className="block rounded-[32px] bg-primary p-6 text-primary-foreground transition hover:brightness-110"
          >
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider">
              Caixa de entrada
            </h4>
            <p className="text-sm leading-snug">
              {pendingDemands > 0
                ? `${pendingDemands} ${pendingDemands === 1 ? "novo pedido aguarda" : "novos pedidos aguardam"} aprovação. Abrir agora.`
                : "Nenhum pedido pendente. Compartilhe o link do painel do cliente para receber novas demandas."}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  accent,
  href,
}: {
  label: string;
  value: string;
  delta: string;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <div className="flex flex-col gap-4 rounded-[32px] bg-surface p-8 ring-1 ring-black/5 transition hover:ring-primary/20">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-4xl font-semibold tracking-tight", accent && "text-primary")}>
          {value}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            accent ? "italic text-muted-foreground" : "text-emerald-400",
          )}
        >
          {delta}
        </span>
      </div>
    </div>
  );
  if (href) return <Link to={href}>{inner}</Link>;
  return inner;
}
