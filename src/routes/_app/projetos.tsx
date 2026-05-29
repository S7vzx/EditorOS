import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Search, LayoutGrid, List, Plus, Calendar as CalIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createProject,
  updateProjectStatus,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_ORDER,
  type ProjectRow,
  type ProjectStatus,
} from "@/lib/db";
import { projectsQuery, queryKeys } from "@/lib/queries";
import { clientOnlyLoader } from "@/lib/client-loader";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — EditorOS" },
      {
        name: "description",
        content: "Gerencie clientes, projetos e entregas em Kanban.",
      },
    ],
  }),
  loader: clientOnlyLoader(({ context }) => {
    context.queryClient.prefetchQuery(projectsQuery());
  }),
  component: ProjetosPage,
});

const PROJECT_STATUS_PILL: Record<ProjectStatus, string> = {
  briefing: "bg-neutral-800 text-muted-foreground border-neutral-700",
  edicao: "bg-primary/10 text-primary border-primary/20",
  thumbnail: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  revisao: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  entregue: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function ProjetosPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery(projectsQuery());

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      updateProjectStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.projects });
      const prev = qc.getQueryData<ProjectRow[]>(queryKeys.projects);
      qc.setQueryData<ProjectRow[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, status } : p)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.projects, ctx.prev);
      toast.error("Não consegui mover o projeto.");
    },
    // Removido invalidate no onSuccess: o update otimista já reflete o estado
    // final. Invalidação extra causa refetch desnecessário em todo Kanban.
  });

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          (p.client_name ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, query],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ProjectStatus;
    const id = active.id as string;
    const target = projects.find((p) => p.id === id);
    if (!target || target.status === newStatus) return;
    toast.success(`Movido para ${PROJECT_STATUS_LABEL[newStatus]}`, {
      description: target.title,
    });
    updateStatus.mutate({ id, status: newStatus });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Projetos</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Carregando..." : `${filtered.length} projetos no pipeline`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition active:scale-95 hover:brightness-110">
              <Plus className="size-4" strokeWidth={2.5} /> Novo projeto
            </button>
          </DialogTrigger>
          <NewProjectDialog onDone={() => setOpen(false)} />
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar projeto ou cliente..."
            className="w-full rounded-lg bg-neutral-900/40 py-2 pl-10 pr-3 text-sm outline-none ring-1 ring-neutral-800 focus:bg-neutral-900 focus:ring-primary/50"
          />
        </div>
        <div className="flex rounded-lg bg-neutral-900/40 p-1 ring-1 ring-neutral-800">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              view === "kanban" ? "bg-neutral-800 text-foreground" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              view === "list" ? "bg-neutral-800 text-foreground" : "text-muted-foreground",
            )}
          >
            <List className="size-3.5" /> Lista
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {PROJECT_STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                projects={filtered.filter((p) => p.status === status)}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-[20px] bg-surface p-5 ring-1 ring-black/5 transition hover:ring-primary/20"
            >
              <div>
                <h4 className="text-base font-medium">{p.title}</h4>
                <p className="text-xs text-muted-foreground">Cliente: {p.client_name ?? "—"}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {p.deadline
                    ? new Date(p.deadline + "T12:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"}
                </span>
                <StatusPill status={p.status as ProjectStatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-tight",
        PROJECT_STATUS_PILL[status],
      )}
    >
      {PROJECT_STATUS_LABEL[status]}
    </span>
  );
}

function KanbanColumn({ status, projects }: { status: ProjectStatus; projects: ProjectRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 rounded-[24px] bg-neutral-900/30 p-4 ring-1 ring-black/5 transition-colors min-h-[200px]",
        isOver && "bg-primary/5 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {PROJECT_STATUS_LABEL[status]}
        </span>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {projects.length}
        </span>
      </div>
      <div className="space-y-3">
        {projects.map((p) => (
          <KanbanCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ project }: { project: ProjectRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-[18px] bg-surface p-4 ring-1 ring-black/5 transition hover:ring-primary/30",
        isDragging && "opacity-50 ring-primary/50",
      )}
    >
      <h4 className="text-sm font-medium leading-tight">{project.title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{project.client_name ?? "Sem cliente"}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <CalIcon className="size-3" />
          {project.deadline
            ? new Date(project.deadline + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })
            : "—"}
        </span>
        <span
          className={cn(
            "size-2 rounded-full",
            project.priority === "alta" && "bg-rose-400",
            project.priority === "media" && "bg-amber-400",
            project.priority === "baixa" && "bg-emerald-400",
          )}
        />
      </div>
    </div>
  );
}

function NewProjectDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState<ProjectRow["type"]>("video");
  const [priority, setPriority] = useState<ProjectRow["priority"]>("media");
  const [deadline, setDeadline] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createProject({
        title,
        client_name: client || null,
        type,
        priority,
        deadline: deadline || null,
        status: "briefing",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Projeto criado", { description: title });
      onDone();
      setTitle("");
      setClient("");
      setDeadline("");
    },
    onError: () => toast.error("Erro ao criar projeto"),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo projeto</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="np-title">Título</Label>
          <Input
            id="np-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Vídeo institucional Q3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="np-client">Cliente</Label>
          <Input
            id="np-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProjectRow["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="thumb">Thumbnail</SelectItem>
                <SelectItem value="shorts">Shorts</SelectItem>
                <SelectItem value="reels">Reels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as ProjectRow["priority"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="np-deadline">Deadline</Label>
          <Input
            id="np-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <button
          disabled={!title || create.isPending}
          onClick={() => create.mutate()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          Criar projeto
        </button>
      </DialogFooter>
    </DialogContent>
  );
}
